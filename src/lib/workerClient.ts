/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProcessingProgress, UpscaleOptions, UpscaleResult } from '../types';
import { WorkerStartPayload } from './upscaleWorker';
import { applyEnhancementRefinement } from './enhancement';

let persistentWorker: Worker | null = null;
let isWorkerRunningJob = false;
let currentJobReject: ((reason?: any) => void) | null = null;

const STUCK_TIMEOUT_MS = 180000; // Allow slow CPU/WASM tiles to finish without false timeouts

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
  enhancementConfigName: string;
  onProgress: (p: ProcessingProgress) => void;
  abortSignal?: AbortSignal;
}

/**
 * Executes a job on the persistent worker without tearing it down upon completion.
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

      if (type === 'PROGRESS') {
        params.onProgress(e.data.progress);
      } else if (type === 'SUCCESS') {
        clearWatchdog();
        isWorkerRunningJob = false;
        currentJobReject = null;

        const { pixels, outW4, outH4, targetW, targetH, backendUsed } = e.data;

        // Render to canvas to create persistent result
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

        // Apply optional refinement only at the final requested resolution.
        // This is faster and keeps worker/main-thread output visually consistent.
        if (params.options.mode !== 'preserve') {
          const finalCtx = finalCanvas.getContext('2d');
          if (finalCtx) {
            const finalImgData = finalCtx.getImageData(0, 0, targetW, targetH);
            applyEnhancementRefinement(finalImgData.data, targetW, targetH, params.options.mode);
            finalCtx.putImageData(finalImgData, 0, 0);
          }
        }

        // Convert canvas to Blob & persistent object URL
        finalCanvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback to dataURL if toBlob fails
              const dataUrl = finalCanvas.toDataURL('image/png');
              const head = 'data:image/png;base64,';
              const sizeBytes = Math.round(((dataUrl.length - head.length) * 3) / 4);
              const processingTimeMs = Date.now() - params.startTime;

              params.onProgress({
                stage: 'done',
                percent: 100,
                currentTile: 1,
                totalTiles: 1,
                message: 'Upscaling complete!',
                timeElapsedMs: processingTimeMs,
                estimatedRemainingMs: 0,
                activeBackend: backendUsed,
              });

              resolve({
                dataUrl,
                width: targetW,
                height: targetH,
                sizeBytes,
                processingTimeMs,
                scale: params.options.scale,
                mode: params.options.mode,
                backendUsed,
                hasAlpha: params.hasAlpha,
                modelName: params.enhancementConfigName,
              });
              return;
            }

            // Create persistent Object URL that will NOT be auto-revoked
            const persistentUrl = URL.createObjectURL(blob);
            const processingTimeMs = Date.now() - params.startTime;

            params.onProgress({
              stage: 'done',
              percent: 100,
              currentTile: 1,
              totalTiles: 1,
              message: 'Upscaling complete!',
              timeElapsedMs: processingTimeMs,
              estimatedRemainingMs: 0,
              activeBackend: backendUsed,
            });

            resolve({
              dataUrl: persistentUrl,
              blob,
              width: targetW,
              height: targetH,
              sizeBytes: blob.size,
              processingTimeMs,
              scale: params.options.scale,
              mode: params.options.mode,
              backendUsed,
              hasAlpha: params.hasAlpha,
              modelName: params.enhancementConfigName,
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

    worker.postMessage({ type: 'START_UPSCALE', payload });
  });
}
