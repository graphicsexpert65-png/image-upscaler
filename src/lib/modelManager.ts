/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as ort from 'onnxruntime-web';
import { InferenceBackend } from '../types';
import { detectDeviceCapabilities } from './device';

// Configure ONNX Runtime environment
if (typeof window !== 'undefined') {
  ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/';
  // Use multithreading if crossOriginIsolated, otherwise 1 thread to prevent errors
  const canMultithread = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
  ort.env.wasm.numThreads = canMultithread
    ? Math.max(1, Math.min(4, Math.floor((navigator.hardwareConcurrency || 4) / 2) || 2))
    : 1;
  ort.env.wasm.simd = true;
}

interface CachedSession {
  session: ort.InferenceSession;
  modelPath: string;
  backend: InferenceBackend;
}

let activeSessionCache: CachedSession | null = null;
const modelArrayBufferCache = new Map<string, ArrayBuffer>();

const CACHE_NAME = 'realesrgan-model-weights-v1';

/**
 * Downloads model binary efficiently using native ArrayBuffer streaming
 * with persistent disk caching via the Cache API and in-memory retention.
 */
export async function fetchModelBuffer(
  modelUrl: string,
  onProgress?: (percent: number, message: string) => void
): Promise<ArrayBuffer> {
  // 1. In-memory cache hit (0ms)
  const cached = modelArrayBufferCache.get(modelUrl);
  if (cached) {
    onProgress?.(100, 'AI model ready (in-memory cache)');
    return cached;
  }

  // 2. Persistent browser disk cache check (Cache API)
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME);
      const matched = await cache.match(modelUrl);
      if (matched) {
        onProgress?.(50, 'Loading neural model weights from disk cache...');
        const buffer = await matched.arrayBuffer();
        modelArrayBufferCache.set(modelUrl, buffer);
        onProgress?.(100, 'AI model ready');
        return buffer;
      }
    } catch (e) {
      console.warn('Persistent cache unavailable, fetching directly:', e);
    }
  }

  // 3. Network fetch
  onProgress?.(10, 'Loading AI model...');

  const response = await fetch(modelUrl);
  if (!response.ok) {
    throw new Error(`Failed to load AI model file from ${modelUrl} (${response.status} ${response.statusText})`);
  }

  onProgress?.(50, 'Buffering neural network weights...');

  // Save to persistent Cache API in the background if available
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME);
      cache.put(modelUrl, response.clone()).catch(() => {});
    } catch {}
  }

  const buffer = await response.arrayBuffer();
  modelArrayBufferCache.set(modelUrl, buffer);
  onProgress?.(100, 'AI model ready');
  return buffer;
}

/**
 * Quick 16x16 warm-up inference to pre-compile WebGPU WGSL shaders and WASM kernels.
 * Prevents initial shader compilation stutter on the user's first tile.
 */
export async function warmUpSession(session: ort.InferenceSession) {
  try {
    const inputName = session.inputNames[0] || 'input';
    const dummyData = new Float32Array(1 * 3 * 16 * 16);
    const dummyTensor = new ort.Tensor('float32', dummyData, [1, 3, 16, 16]);
    await session.run({ [inputName]: dummyTensor });
    (dummyTensor as any).dispose?.();
  } catch (e) {
    // Non-critical, continue
  }
}

/**
 * Creates or retrieves a cached ONNX InferenceSession.
 * If the model has already been loaded, reuses the session instantly without reloading.
 * Automatically tries WebGPU first, then WASM SIMD, then safe WASM fallback.
 */
export async function getOrLoadModelSession(
  modelUrl: string,
  onProgress?: (percent: number, message: string) => void
): Promise<{ session: ort.InferenceSession; backend: InferenceBackend; wasCached: boolean }> {
  // Instant reuse if already initialized (0ms)
  if (activeSessionCache && activeSessionCache.modelPath === modelUrl) {
    onProgress?.(100, 'AI model ready');
    return {
      session: activeSessionCache.session,
      backend: activeSessionCache.backend,
      wasCached: true,
    };
  }

  const modelBuffer = await fetchModelBuffer(modelUrl, onProgress);
  const device = await detectDeviceCapabilities();

  onProgress?.(95, 'Initializing inference engine...');

  // 1. Try WebGPU with high-performance provider options
  if (device.hasWebGPU) {
    try {
      const session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
        executionProviders: ['webgpu'],
        graphOptimizationLevel: 'all',
        enableCpuMemArena: true,
        enableMemPattern: true,
      });

      await warmUpSession(session);

      activeSessionCache = {
        session,
        modelPath: modelUrl,
        backend: 'webgpu',
      };
      return { session, backend: 'webgpu', wasCached: false };
    } catch (gpuError) {
      console.warn('WebGPU execution provider failed to initialize, falling back to WASM:', gpuError);
    }
  }

  // 2. Try WASM with local files
  try {
    const session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
      enableCpuMemArena: true,
      enableMemPattern: true,
    });

    await warmUpSession(session);

    activeSessionCache = {
      session,
      modelPath: modelUrl,
      backend: 'wasm',
    };
    return { session, backend: 'wasm', wasCached: false };
  } catch (localWasmError: any) {
    console.warn('Local WASM init encountered issue, trying CDN fallback:', localWasmError);
    // 3. Try WASM with CDN distribution paths
    try {
      ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/';
      const session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });

      await warmUpSession(session);

      activeSessionCache = {
        session,
        modelPath: modelUrl,
        backend: 'wasm',
      };
      return { session, backend: 'wasm', wasCached: false };
    } catch (cdnWasmError: any) {
      console.error('All WASM execution providers failed:', cdnWasmError);
      throw new Error(
        `Failed to initialize super-resolution AI model in browser: ${localWasmError?.message || cdnWasmError?.message || 'WASM runtime error'}. Please verify WebAssembly is enabled.`
      );
    }
  }
}
