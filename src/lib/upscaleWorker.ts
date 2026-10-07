/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as ort from 'onnxruntime-web';
import { InferenceBackend, ProcessingProgress, UpscaleOptions } from '../types';
import { generateSeamlessTiles, determineOptimalTileSize } from './tiler';

// Configure ONNX Runtime environment inside Web Worker
ort.env.wasm.wasmPaths = '/wasm/';
// Enable multi-threading based on hardware concurrency while leaving cores for the UI
const canUseThreads = typeof crossOriginIsolated !== 'undefined'
  && crossOriginIsolated
  && typeof SharedArrayBuffer !== 'undefined';
const threadCount = canUseThreads && typeof navigator !== 'undefined'
  ? Math.max(1, Math.min(4, Math.floor((navigator.hardwareConcurrency || 4) / 2)))
  : 1;
ort.env.wasm.numThreads = threadCount;

// Keep model session in worker memory across multiple image uploads
let cachedSession: ort.InferenceSession | null = null;
let cachedModelPath: string | null = null;
let cachedBackend: InferenceBackend = 'wasm';

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
    (self as any).postMessage({ type: 'PONG', cachedModel: cachedModelPath });
    return;
  }

  if (type === 'START_UPSCALE') {
    const data = payload as WorkerStartPayload;
    const startTime = Date.now();

    try {
      // 1. Session Init or Instant Memory Reuse
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
            timeElapsedMs: Date.now() - startTime,
            estimatedRemainingMs: 0,
            activeBackend: 'wasm',
          } as ProcessingProgress,
        });

        // Fetch model ArrayBuffer inside worker
        const resp = await fetch(data.modelFile);
        if (!resp.ok) {
          throw new Error(`Failed to load AI model file (${resp.status} ${resp.statusText})`);
        }
        const modelBuffer = await resp.arrayBuffer();

        let session: ort.InferenceSession | null = null;

        // Try WebGPU first if supported in worker
        if (data.deviceHasWebGPU && 'gpu' in navigator && (navigator as any).gpu) {
          try {
            session = await ort.InferenceSession.create(modelBuffer, {
              executionProviders: ['webgpu'],
              graphOptimizationLevel: 'all',
            });
            activeBackend = 'webgpu';
          } catch (gpuErr) {
            console.warn('Worker WebGPU provider failed, falling back to WASM SIMD:', gpuErr);
          }
        }

        // Fallback to WASM SIMD + Multithreading
        if (!session) {
          try {
            session = await ort.InferenceSession.create(modelBuffer, {
              executionProviders: ['wasm'],
              graphOptimizationLevel: 'all',
            });
            activeBackend = 'wasm';
          } catch (wasmErr) {
            console.warn('Local WASM init failed in worker, trying CDN paths:', wasmErr);
            ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/';
            session = await ort.InferenceSession.create(modelBuffer, {
              executionProviders: ['wasm'],
              graphOptimizationLevel: 'all',
            });
            activeBackend = 'wasm';
          }
        }

        cachedSession = session;
        cachedModelPath = data.modelFile;
        cachedBackend = activeBackend;
      } else {
        // Model was already loaded! Instant reuse
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
          timeElapsedMs: Date.now() - startTime,
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

      // Optimal tile size: 512px for WebGPU, 256-384px for WASM, or exact dimensions for <=512px images
      const tileSize = determineOptimalTileSize(
        workingW,
        workingH,
        cachedBackend,
        data.deviceMemoryGB
      );
      const pad = 12;
      const tiles = generateSeamlessTiles(workingW, workingH, tileSize, pad, modelScale);
      const totalTiles = tiles.length;

      // 4x output buffer (Uint8ClampedArray for final reconstruction)
      const outW4 = workingW * modelScale;
      const outH4 = workingH * modelScale;
      const outPixels4 = new Uint8ClampedArray(outW4 * outH4 * 4);

      const inputName = session.inputNames[0] || 'input';
      const outputName = session.outputNames[0] || 'output';

      for (let i = 0; i < totalTiles; i++) {
        const tile = tiles[i];
        const pw = tile.paddedW;
        const ph = tile.paddedH;

        // Local input tensor [1, 3, ph, pw] in NCHW format
        const tileTensorData = new Float32Array(1 * 3 * ph * pw);
        const planeSize = pw * ph;

        for (let ty = 0; ty < ph; ty++) {
          const sy = tile.paddedY + ty;
          for (let tx = 0; tx < pw; tx++) {
            const sx = tile.paddedX + tx;
            const srcIdx = (sy * workingW + sx) * 4;
            const dstIdx = ty * pw + tx;

            tileTensorData[dstIdx] = srcPixels[srcIdx] / 255.0;
            tileTensorData[planeSize + dstIdx] = srcPixels[srcIdx + 1] / 255.0;
            tileTensorData[planeSize * 2 + dstIdx] = srcPixels[srcIdx + 2] / 255.0;
          }
        }

        const inputTensor = new ort.Tensor('float32', tileTensorData, [1, 3, ph, pw]);
        const feeds: Record<string, ort.Tensor> = { [inputName]: inputTensor };

        const results = await session.run(feeds);
        const outputTensor = results[outputName];
        const outData = outputTensor.data as Float32Array;

        const outPaddedW = pw * modelScale;
        const outPlaneSize = outPaddedW * (ph * modelScale);

        // Crop valid interior region directly into 4x output buffer
        for (let vy = 0; vy < tile.validH; vy++) {
          const outY = tile.cropY + vy;
          const globalY = tile.destY + vy;
          const origGlobalY = tile.inputY + vy / modelScale;

          for (let vx = 0; vx < tile.validW; vx++) {
            const outX = tile.cropX + vx;
            const globalX = tile.destX + vx;
            const outIdx = outY * outPaddedW + outX;
            const targetPx = (globalY * outW4 + globalX) * 4;

            const r = Math.max(0, Math.min(255, Math.round(outData[outIdx] * 255)));
            const g = Math.max(0, Math.min(255, Math.round(outData[outPlaneSize + outIdx] * 255)));
            const b = Math.max(0, Math.min(255, Math.round(outData[outPlaneSize * 2 + outIdx] * 255)));

            outPixels4[targetPx] = r;
            outPixels4[targetPx + 1] = g;
            outPixels4[targetPx + 2] = b;

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

        const elapsed = Date.now() - startTime;
        const progressPct = Math.round(20 + ((i + 1) / totalTiles) * 75);
        const msPerTile = elapsed / (i + 1);
        const remainingMs = Math.round((totalTiles - (i + 1)) * msPerTile);

        // Send progress update
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

      // Post-refinement is intentionally deferred until after final resize on the main thread.
      // This avoids sharpening a much larger temporary 4x buffer for 2x/8x output.

      // Transfer resulting pixels back to main thread with zero copy
      (self as any).postMessage(
        {
          type: 'SUCCESS',
          pixels: outPixels4.buffer,
          outW4,
          outH4,
          targetW,
          targetH,
          processingTimeMs: Date.now() - startTime,
          backendUsed: cachedBackend,
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
