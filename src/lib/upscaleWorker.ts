/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as ort from 'onnxruntime-web';
import { InferenceBackend, ProcessingProgress, UpscaleOptions } from '../types';
import { generateSeamlessTiles, determineOptimalTileSize } from './tiler';

// Configure ONNX Runtime environment inside Web Worker
ort.env.wasm.wasmPaths = '/wasm/';
const canMultithread = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
const threadCount = canMultithread
  ? Math.max(1, Math.min(4, Math.floor((navigator.hardwareConcurrency || 4) / 2) || 2))
  : 1;
ort.env.wasm.numThreads = threadCount;
ort.env.wasm.simd = true;

// Keep model session & buffer in worker memory across multiple image uploads
let cachedSession: ort.InferenceSession | null = null;
let cachedModelPath: string | null = null;
let cachedBackend: InferenceBackend = 'wasm';
const modelBufferCache = new Map<string, ArrayBuffer>();

const CACHE_NAME = 'realesrgan-model-weights-v1';

async function fetchModelBufferInWorker(modelUrl: string): Promise<ArrayBuffer> {
  const memCached = modelBufferCache.get(modelUrl);
  if (memCached) return memCached;

  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME);
      const matched = await cache.match(modelUrl);
      if (matched) {
        const buf = await matched.arrayBuffer();
        modelBufferCache.set(modelUrl, buf);
        return buf;
      }
    } catch {}
  }

  const resp = await fetch(modelUrl);
  if (!resp.ok) {
    throw new Error(`Failed to load AI model file (${resp.status} ${resp.statusText})`);
  }

  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME);
      cache.put(modelUrl, resp.clone()).catch(() => {});
    } catch {}
  }

  const buf = await resp.arrayBuffer();
  modelBufferCache.set(modelUrl, buf);
  return buf;
}

async function warmUpWorkerSession(session: ort.InferenceSession) {
  try {
    const inputName = session.inputNames[0] || 'input';
    const dummyData = new Float32Array(1 * 3 * 16 * 16);
    const dummyTensor = new ort.Tensor('float32', dummyData, [1, 3, 16, 16]);
    await session.run({ [inputName]: dummyTensor });
    (dummyTensor as any).dispose?.();
  } catch {}
}

export interface WorkerStartPayload {
  modelFile: string;
  srcPixels: Uint8ClampedArray;
  origW: number;
  origH: number;
  workingW: number;
  workingH: number;
  targetW: number;
  targetH: number;
  options: UpscaleOptions;
  hasAlpha: boolean;
  deviceHasWebGPU: boolean;
  deviceMemoryGB: number | null;
}

self.addEventListener('message', async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'PING') {
    (self as any).postMessage({ type: 'PONG', cachedModel: cachedModelPath, backend: cachedBackend });
    return;
  }

  if (type === 'START_UPSCALE') {
    const data = payload as WorkerStartPayload;
    const startTime = performance.now();
    let modelLoadMs = 0;
    let sessionInitMs = 0;

    try {
      // Check if main thread WebGPU should be requested:
      // If the device has WebGPU, but WebGPU is NOT supported in this Web Worker context
      const workerHasWebGPU = 'gpu' in navigator && !!(navigator as any).gpu;
      if (data.deviceHasWebGPU && !workerHasWebGPU) {
        // Return payload buffer back to main thread so it can run WebGPU at maximum hardware speed!
        (self as any).postMessage(
          { type: 'NEEDS_MAIN_THREAD_WEBGPU', srcPixels: data.srcPixels.buffer },
          [data.srcPixels.buffer]
        );
        return;
      }

      // 1. Session Init or Instant In-Memory Reuse (0ms)
      let activeBackend = cachedBackend;

      if (!cachedSession || cachedModelPath !== data.modelFile) {
        (self as any).postMessage({
          type: 'PROGRESS',
          progress: {
            stage: 'loading-model',
            percent: 5,
            currentTile: 0,
            totalTiles: 0,
            message: 'Loading neural network super-resolution weights...',
            timeElapsedMs: Math.round(performance.now() - startTime),
            estimatedRemainingMs: 0,
            activeBackend: data.deviceHasWebGPU && workerHasWebGPU ? 'webgpu' : 'wasm',
          } as ProcessingProgress,
        });

        const loadStart = performance.now();
        const modelBuffer = await fetchModelBufferInWorker(data.modelFile);
        modelLoadMs = Math.round(performance.now() - loadStart);

        const initStart = performance.now();
        let session: ort.InferenceSession | null = null;

        // Try WebGPU first if supported in worker
        if (data.deviceHasWebGPU && workerHasWebGPU) {
          try {
            session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
              executionProviders: ['webgpu'],
              graphOptimizationLevel: 'all',
              enableCpuMemArena: true,
              enableMemPattern: true,
            });
            activeBackend = 'webgpu';
            await warmUpWorkerSession(session);
          } catch (gpuErr) {
            console.warn('Worker WebGPU provider failed, falling back to WASM SIMD:', gpuErr);
          }
        }

        // Fallback to WASM SIMD + Multithreading
        if (!session) {
          try {
            session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
              executionProviders: ['wasm'],
              graphOptimizationLevel: 'all',
              enableCpuMemArena: true,
              enableMemPattern: true,
            });
            activeBackend = 'wasm';
            await warmUpWorkerSession(session);
          } catch (wasmErr) {
            console.warn('Local WASM init failed in worker, trying CDN paths:', wasmErr);
            ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/';
            session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
              executionProviders: ['wasm'],
              graphOptimizationLevel: 'all',
            });
            activeBackend = 'wasm';
            await warmUpWorkerSession(session);
          }
        }

        sessionInitMs = Math.round(performance.now() - initStart);
        cachedSession = session;
        cachedModelPath = data.modelFile;
        cachedBackend = activeBackend;
      } else {
        activeBackend = cachedBackend;
      }

      (self as any).postMessage({
        type: 'PROGRESS',
        progress: {
          stage: 'preparing-tiles',
          percent: 15,
          currentTile: 0,
          totalTiles: 0,
          message: 'Preparing image tiles...',
          timeElapsedMs: Math.round(performance.now() - startTime),
          estimatedRemainingMs: 0,
          activeBackend: cachedBackend,
        } as ProcessingProgress,
      });

      const session = cachedSession!;
      const modelScale = 4;
      const { workingW, workingH, targetW, targetH, srcPixels } = data;

      // Extract raw alpha if transparent
      let rawAlpha: Uint8ClampedArray | null = null;
      if (data.hasAlpha) {
        rawAlpha = new Uint8ClampedArray(workingW * workingH);
        for (let i = 0; i < workingW * workingH; i++) {
          rawAlpha[i] = srcPixels[i * 4 + 3];
        }
      }

      // Optimal tile size: 512px for WebGPU, 256-384px for WASM, or exact dimensions for small images
      const tileSize = determineOptimalTileSize(
        workingW,
        workingH,
        cachedBackend,
        data.deviceMemoryGB
      );
      const pad = 8; // 8px padding is optimal for receptive field without wasting tensor area
      const tiles = generateSeamlessTiles(workingW, workingH, tileSize, pad, modelScale);
      const totalTiles = tiles.length;

      // 4x output buffer (Uint8ClampedArray for final reconstruction)
      const outW4 = workingW * modelScale;
      const outH4 = workingH * modelScale;
      const outPixels4 = new Uint8ClampedArray(outW4 * outH4 * 4);

      const inputName = session.inputNames[0] || 'input';
      const outputName = session.outputNames[0] || 'output';

      // Pre-allocate a single reusable Float32Array to avoid repetitive GC pauses
      let maxTileW = 0;
      let maxTileH = 0;
      for (const t of tiles) {
        if (t.paddedW > maxTileW) maxTileW = t.paddedW;
        if (t.paddedH > maxTileH) maxTileH = t.paddedH;
      }
      const sharedTileTensorData = new Float32Array(1 * 3 * maxTileH * maxTileW);

      const inferenceStart = performance.now();
      let tileStitchingMs = 0;

      for (let i = 0; i < totalTiles; i++) {
        (self as any).postMessage({ type: 'HEARTBEAT' });

        const tile = tiles[i];
        const pw = tile.paddedW;
        const ph = tile.paddedH;
        const planeSize = pw * ph;
        const requiredSize = 3 * planeSize;
        const tileDataSlice = sharedTileTensorData.subarray(0, requiredSize);

        for (let ty = 0; ty < ph; ty++) {
          const sy = tile.paddedY + ty;
          const rowSrcIdx = sy * workingW;
          const rowDstIdx = ty * pw;

          for (let tx = 0; tx < pw; tx++) {
            const sx = tile.paddedX + tx;
            const srcIdx = (rowSrcIdx + sx) * 4;
            const dstIdx = rowDstIdx + tx;

            tileDataSlice[dstIdx] = srcPixels[srcIdx] / 255.0;
            tileDataSlice[planeSize + dstIdx] = srcPixels[srcIdx + 1] / 255.0;
            tileDataSlice[planeSize * 2 + dstIdx] = srcPixels[srcIdx + 2] / 255.0;
          }
        }

        const inputTensor = new ort.Tensor('float32', tileDataSlice, [1, 3, ph, pw]);
        const feeds: Record<string, ort.Tensor> = { [inputName]: inputTensor };

        const results = await session.run(feeds);
        const outputTensor = results[outputName];
        const outData = outputTensor.data as Float32Array;

        (inputTensor as any).dispose?.();

        const stitchStart = performance.now();
        const outPaddedW = pw * modelScale;
        const outPlaneSize = outPaddedW * (ph * modelScale);

        // Crop valid interior region directly into 4x output buffer
        for (let vy = 0; vy < tile.validH; vy++) {
          const outY = tile.cropY + vy;
          const globalY = tile.destY + vy;
          const origGlobalY = tile.inputY + vy / modelScale;
          const outRowOffset = outY * outPaddedW;
          const targetRowOffset = globalY * outW4;

          for (let vx = 0; vx < tile.validW; vx++) {
            const outX = tile.cropX + vx;
            const globalX = tile.destX + vx;
            const outIdx = outRowOffset + outX;
            const targetPx = (targetRowOffset + globalX) * 4;

            outPixels4[targetPx] = Math.max(0, Math.min(255, Math.round(outData[outIdx] * 255)));
            outPixels4[targetPx + 1] = Math.max(0, Math.min(255, Math.round(outData[outPlaneSize + outIdx] * 255)));
            outPixels4[targetPx + 2] = Math.max(0, Math.min(255, Math.round(outData[outPlaneSize * 2 + outIdx] * 255)));

            if (rawAlpha) {
              const origGlobalX = tile.inputX + vx / modelScale;
              const x0 = Math.floor(origGlobalX);
              const y0 = Math.floor(origGlobalY);
              const x1 = Math.min(workingW - 1, x0 + 1);
              const y1 = Math.min(workingH - 1, y0 + 1);
              const dx = origGlobalX - x0;
              const dy = origGlobalY - y0;

              const a00 = rawAlpha[y0 * workingW + x0];
              const a10 = rawAlpha[y0 * workingW + x1];
              const a01 = rawAlpha[y1 * workingW + x0];
              const a11 = rawAlpha[y1 * workingW + x1];

              const interpA =
                (1 - dx) * (1 - dy) * a00 +
                dx * (1 - dy) * a10 +
                (1 - dx) * dy * a01 +
                dx * dy * a11;

              outPixels4[targetPx + 3] = Math.round(interpA);
            } else {
              outPixels4[targetPx + 3] = 255;
            }
          }
        }
        tileStitchingMs += Math.round(performance.now() - stitchStart);

        const elapsed = Math.round(performance.now() - startTime);
        const progressPct = Math.round(20 + ((i + 1) / totalTiles) * 75);
        const msPerTile = elapsed / (i + 1);
        const remainingMs = Math.round((totalTiles - (i + 1)) * msPerTile);

        (self as any).postMessage({
          type: 'PROGRESS',
          progress: {
            stage: 'upscaling',
            percent: progressPct,
            currentTile: i + 1,
            totalTiles,
            message: totalTiles === 1
              ? `AI Super-Resolution processing (${cachedBackend.toUpperCase()})...`
              : `Processing tile ${i + 1} of ${totalTiles} (${cachedBackend.toUpperCase()})...`,
            timeElapsedMs: elapsed,
            estimatedRemainingMs: remainingMs,
            activeBackend: cachedBackend,
          } as ProcessingProgress,
        });
      }

      const aiInferenceMs = Math.round(performance.now() - inferenceStart - tileStitchingMs);

      // Transfer resulting 4x neural pixels back to main thread with zero copy
      (self as any).postMessage(
        {
          type: 'SUCCESS',
          pixels: outPixels4.buffer,
          outW4,
          outH4,
          targetW,
          targetH,
          processingTimeMs: Math.round(performance.now() - startTime),
          backendUsed: cachedBackend,
          timings: {
            modelLoadMs,
            sessionInitMs,
            aiInferenceMs,
            tileStitchingMs,
          },
        },
        [outPixels4.buffer]
      );
    } catch (err: any) {
      (self as any).postMessage({
        type: 'ERROR',
        message: err?.message || 'Inference error in worker',
      });
    }
  }
});
