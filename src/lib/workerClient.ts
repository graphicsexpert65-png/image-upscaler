/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProcessingProgress, UpscaleOptions, UpscaleResult } from '../types';
import { WorkerStartPayload } from './upscaleWorker';
import { applyEnhancementRefinement } from './enhancement';
import { StageTimer } from './profiler';

let persistentWorker: Worker | null = null;
let isWorkerRunningJob = false;
let currentJobReject: ((reason?: any) => void) | null = null;

// Adaptive watchdog timeout (120s of complete silence without progress or heartbeats)
const STUCK_TIMEOUT_MS = 120000;

/**
 * Gets or lazily creates the persistent Web Worker.
 * Keeping the worker alive preserves the loaded ONNX model in memory across uploads.
 */
export function getOrCreatePersistentWorker(): Worker {
  if (!persistentWorker) {
    persistentWorker = new Worker(new URL('./upscaleWorker.ts', import.meta.url), {
      type: 'module',
    });
  }
  return persistentWorker;
}

/**
 * Terminates the worker explicitly (e.g. on user cancellation or hard reset).
 */
export function terminatePersistentWorker() {
  if (currentJobReject) {
    currentJobReject(new Error('Upscaling cancelled by user.'));
    currentJobReject = null;
  }
  if (persistentWorker) {
    persistentWorker.terminate();
    persistentWorker = null;
  }
  isWorkerRunningJob = false;
}

export interface RunWorkerJobParams {
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
  startTime: number;
  imagePrepMs: number;
  enhancementConfigName: string;
  onProgress: (p: ProcessingProgress) => void;
  abortSignal?: AbortSignal;
}

/**
 * Executes a job on the persistent worker without tearing it down upon completion.
 * Transfers ArrayBuffers with zero-copy, eliminates redundant canvas conversions,
 * and profiles every stage.
 */
export function executeJobOnWorker(params: RunWorkerJobParams): Promise<UpscaleResult> {
  return new Promise((resolve, reject) => {
    // If worker is somehow already busy with a previous job, clean up and restart
    if (isWorkerRunningJob) {
      terminatePersistentWorker();
    }

    const worker = getOrCreatePersistentWorker();
    isWorkerRunningJob = true;
    currentJobReject = reject;

    let stuckTimer: any = null;

    const clearWatchdog = () => {
      if (stuckTimer) {
        clearTimeout(stuckTimer);
        stuckTimer = null;
      }
    };

    const resetWatchdog = () => {
      clearWatchdog();
      stuckTimer = setTimeout(() => {
        clearWatchdog();
        isWorkerRunningJob = false;
        terminatePersistentWorker();
        reject(
          new Error(
            'Processing timed out or became unresponsive. Please try again with a smaller scale or image.'
          )
        );
      }, STUCK_TIMEOUT_MS);
    };

    if (params.abortSignal) {
      const abortHandler = () => {
        clearWatchdog();
        isWorkerRunningJob = false;
        terminatePersistentWorker();
        reject(new Error('Upscaling cancelled by user.'));
      };

      if (params.abortSignal.aborted) {
        abortHandler();
        return;
      }
      params.abortSignal.addEventListener('abort', abortHandler, { once: true });
    }

    worker.onmessage = (e: MessageEvent) => {
      resetWatchdog();
      const { type } = e.data;

      if (type === 'HEARTBEAT') {
        return;
      }

      if (type === 'NEEDS_MAIN_THREAD_WEBGPU') {
        clearWatchdog();
        isWorkerRunningJob = false;
        currentJobReject = null;
        // Signal to inference.ts that main thread WebGPU should be executed directly
        const returnedPixels = new Uint8ClampedArray(e.data.srcPixels);
        const err = new Error('FALLBACK_MAIN_THREAD_WEBGPU');
        (err as any).returnedPixels = returnedPixels;
        reject(err);
        return;
      }

      if (type === 'PROGRESS') {
        params.onProgress(e.data.progress);
      } else if (type === 'SUCCESS') {
        clearWatchdog();
        isWorkerRunningJob = false;
        currentJobReject = null;

        const { pixels, outW4, outH4, targetW, targetH, backendUsed, timings: workerTimings } = e.data;
        const stageTimer = new StageTimer();
        stageTimer.set('imagePrep', params.imagePrepMs);
        stageTimer.set('modelLoad', workerTimings?.modelLoadMs || 0);
        stageTimer.set('sessionInit', workerTimings?.sessionInitMs || 0);
        stageTimer.set('aiInference', workerTimings?.aiInferenceMs || 0);
        stageTimer.set('tileStitching', workerTimings?.tileStitchingMs || 0);

        // 1. Reconstruct 4x neural canvas from tile outputs
        const canvas4x = document.createElement('canvas');
        canvas4x.width = outW4;
        canvas4x.height = outH4;
        const ctx4x = canvas4x.getContext('2d');
        if (!ctx4x) {
          reject(new Error('Failed to create canvas context.'));
          return;
        }

        const imgData = new ImageData(new Uint8ClampedArray(pixels), outW4, outH4);
        ctx4x.putImageData(imgData, 0, 0);

        // 2. Render to final target resolution (2X, 4X, or 8X)
        const resizeStart = performance.now();
        let finalCanvas: HTMLCanvasElement;
        if (targetW === outW4 && targetH === outH4) {
          finalCanvas = canvas4x;
        } else {
          finalCanvas = document.createElement('canvas');
          finalCanvas.width = targetW;
          finalCanvas.height = targetH;
          const finalCtx = finalCanvas.getContext('2d');
          if (!finalCtx) {
            reject(new Error('Failed to create target resolution canvas.'));
            return;
          }
          finalCtx.imageSmoothingEnabled = true;
          finalCtx.imageSmoothingQuality = 'high';
          finalCtx.drawImage(canvas4x, 0, 0, targetW, targetH);
        }
        stageTimer.set('finalResize', performance.now() - resizeStart);

        // 3. Apply subtle mode refinement directly at final resolution
        // (Preserve Original: 0 modification; Natural: subtle 0.08 refinement)
        const enhStart = performance.now();
        if (params.options.mode !== 'preserve') {
          const finalCtx = finalCanvas.getContext('2d');
          if (finalCtx) {
            const finalImgData = finalCtx.getImageData(0, 0, targetW, targetH);
            applyEnhancementRefinement(finalImgData.data, targetW, targetH, params.options.mode);
            finalCtx.putImageData(finalImgData, 0, 0);
          }
        }
        stageTimer.set('enhancement', performance.now() - enhStart);

        // 4. Convert canvas to Blob & persistent object URL
        const blobStart = performance.now();
        finalCanvas.toBlob(
          (blob) => {
            stageTimer.set('exportBlob', performance.now() - blobStart);
            const totalMs = Math.round(performance.now() - params.startTime);
            const finalTimings = stageTimer.finish(totalMs);

            if (!blob) {
              const dataUrl = finalCanvas.toDataURL('image/png');
              const head = 'data:image/png;base64,';
              const sizeBytes = Math.round(((dataUrl.length - head.length) * 3) / 4);

              params.onProgress({
                stage: 'done',
                percent: 100,
                currentTile: 1,
                totalTiles: 1,
                message: 'Upscaling complete!',
                timeElapsedMs: totalMs,
                estimatedRemainingMs: 0,
                activeBackend: backendUsed,
              });

              resolve({
                dataUrl,
                width: targetW,
                height: targetH,
                sizeBytes,
                processingTimeMs: totalMs,
                scale: params.options.scale,
                mode: params.options.mode,
                backendUsed,
                hasAlpha: params.hasAlpha,
                modelName: params.enhancementConfigName,
                timings: finalTimings,
              });
              return;
            }

            // Create persistent Object URL that stays available in memory
            const persistentUrl = URL.createObjectURL(blob);

            params.onProgress({
              stage: 'done',
              percent: 100,
              currentTile: 1,
              totalTiles: 1,
              message: 'Upscaling complete!',
              timeElapsedMs: totalMs,
              estimatedRemainingMs: 0,
              activeBackend: backendUsed,
            });

            resolve({
              dataUrl: persistentUrl,
              blob,
              width: targetW,
              height: targetH,
              sizeBytes: blob.size,
              processingTimeMs: totalMs,
              scale: params.options.scale,
              mode: params.options.mode,
              backendUsed,
              hasAlpha: params.hasAlpha,
              modelName: params.enhancementConfigName,
              timings: finalTimings,
            });
          },
          'image/png'
        );
      } else if (type === 'ERROR') {
        clearWatchdog();
        isWorkerRunningJob = false;
        currentJobReject = null;
        reject(new Error(e.data.message || 'Processing failed in worker.'));
      }
    };

    worker.onerror = (err) => {
      clearWatchdog();
      isWorkerRunningJob = false;
      currentJobReject = null;
      terminatePersistentWorker();
      reject(new Error(err?.message || 'Web Worker error occurred.'));
    };

    resetWatchdog();

    const payload: WorkerStartPayload = {
      modelFile: params.modelFile,
      srcPixels: params.srcPixels,
      origW: params.origW,
      origH: params.origH,
      workingW: params.workingW,
      workingH: params.workingH,
      targetW: params.targetW,
      targetH: params.targetH,
      options: params.options,
      hasAlpha: params.hasAlpha,
      deviceHasWebGPU: params.deviceHasWebGPU,
      deviceMemoryGB: params.deviceMemoryGB,
    };

    // Zero-copy transfer of srcPixels ArrayBuffer to the worker
    worker.postMessage({ type: 'START_UPSCALE', payload }, [params.srcPixels.buffer]);
  });
}
