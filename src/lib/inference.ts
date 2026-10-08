/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ImageInfo,
  InferenceBackend,
  ProcessingProgress,
  UpscaleOptions,
  UpscaleResult,
} from '../types';
import {
  bleedTransparentColors,
  loadImageElement,
} from './imageUtils';
import { ENHANCEMENT_MODES, applyEnhancementRefinement } from './enhancement';
import { computeSafeScaleDimensions, MAX_SAFE_CANVAS_DIM } from './canvasLimits';
import { detectDeviceCapabilities } from './device';
import { getOrLoadModelSession } from './modelManager';
import { generateSeamlessTiles, determineOptimalTileSize } from './tiler';
import { executeJobOnWorker } from './workerClient';
import { StageTimer } from './profiler';
import * as ort from 'onnxruntime-web';

/**
 * Executes the super-resolution pipeline.
 * Keeps the model session cached in memory across multiple image runs.
 * Uses WebGPU first (in Worker or Main Thread), with multithreaded WASM fallback.
 * Profiles and logs high-resolution timings for each stage.
 */
export async function runUpscalePipeline(
  imageInfo: ImageInfo,
  options: UpscaleOptions,
  onProgress: (p: ProcessingProgress) => void,
  abortSignal?: AbortSignal
): Promise<UpscaleResult> {
  const startTime = performance.now();
  const enhancementConfig = ENHANCEMENT_MODES[options.mode];

  // 1. Smart Image Size & Memory Safety Calculation
  const safeDims = computeSafeScaleDimensions(
    imageInfo.width,
    imageInfo.height,
    options.scale
  );

  // If requested scale exceeds safe browser limits, guide user cleanly
  if (safeDims.exceedsSafeLimit && safeDims.warningMessage && safeDims.isCapped) {
    if (options.scale === 4 && (imageInfo.width > 3000 || imageInfo.height > 3000)) {
      throw new Error(
        'This image is too large for 4× processing in your current browser. Try 2× upscaling or a smaller image.'
      );
    }
  }

  const targetW = safeDims.effectiveWidth;
  const targetH = safeDims.effectiveHeight;
  const modelScale = 4; // Native Real-ESRGAN scaling factor

  // Critical for 2X & natural portraits:
  // Feed the native original image into the neural network.
  let workingW = imageInfo.width;
  let workingH = imageInfo.height;

  if (workingW * modelScale > MAX_SAFE_CANVAS_DIM || workingH * modelScale > MAX_SAFE_CANVAS_DIM) {
    const clampRatio = Math.min(
      MAX_SAFE_CANVAS_DIM / (workingW * modelScale),
      MAX_SAFE_CANVAS_DIM / (workingH * modelScale)
    );
    workingW = Math.max(16, Math.round(workingW * clampRatio));
    workingH = Math.max(16, Math.round(workingH * clampRatio));
  }

  // 2. Measure Image Preparation
  const prepStart = performance.now();
  const img = await loadImageElement(imageInfo.dataUrl);
  const prepCanvas = document.createElement('canvas');
  prepCanvas.width = workingW;
  prepCanvas.height = workingH;
  const prepCtx = prepCanvas.getContext('2d', { willReadFrequently: true });
  if (!prepCtx) throw new Error('Failed to create canvas context.');

  prepCtx.imageSmoothingEnabled = true;
  prepCtx.imageSmoothingQuality = 'high';
  prepCtx.drawImage(img, 0, 0, workingW, workingH);
  let srcImageData = prepCtx.getImageData(0, 0, workingW, workingH);

  if (imageInfo.hasAlpha) {
    srcImageData = bleedTransparentColors(srcImageData);
  }
  const imagePrepMs = Math.round(performance.now() - prepStart);

  const device = await detectDeviceCapabilities();

  // Primary Path: Execute in persistent Web Worker
  try {
    return await executeJobOnWorker({
      modelFile: enhancementConfig.modelFile,
      srcPixels: srcImageData.data,
      origW: imageInfo.width,
      origH: imageInfo.height,
      workingW,
      workingH,
      targetW,
      targetH,
      options,
      hasAlpha: imageInfo.hasAlpha,
      deviceHasWebGPU: device.hasWebGPU,
      deviceMemoryGB: device.deviceMemoryGB,
      startTime,
      imagePrepMs,
      enhancementConfigName: enhancementConfig.name,
      onProgress,
      abortSignal,
    });
  } catch (workerErr: any) {
    if (workerErr?.message?.includes('cancelled')) {
      throw workerErr;
    }

    if (workerErr?.message === 'FALLBACK_MAIN_THREAD_WEBGPU') {
      console.log('[AI Upscaler] WebGPU unavailable in Worker, activating WebGPU on Main Thread for hardware acceleration');
      const pixelsToUse = workerErr.returnedPixels || srcImageData.data;
      return await runInMainThread({
        modelFile: enhancementConfig.modelFile,
        srcPixels: pixelsToUse,
        origW: imageInfo.width,
        origH: imageInfo.height,
        workingW,
        workingH,
        targetW,
        targetH,
        options,
        hasAlpha: imageInfo.hasAlpha,
        startTime,
        imagePrepMs,
        enhancementConfigName: enhancementConfig.name,
        onProgress,
        abortSignal,
      });
    }

    console.warn('Persistent worker unavailable, falling back to responsive main-thread runner:', workerErr);
    return await runInMainThread({
      modelFile: enhancementConfig.modelFile,
      srcPixels: srcImageData.data,
      origW: imageInfo.width,
      origH: imageInfo.height,
      workingW,
      workingH,
      targetW,
      targetH,
      options,
      hasAlpha: imageInfo.hasAlpha,
      startTime,
      imagePrepMs,
      enhancementConfigName: enhancementConfig.name,
      onProgress,
      abortSignal,
    });
  }
}

/**
 * Highly optimized in-thread runner for WebGPU (or WASM fallback).
 * Yields between tiles to ensure 60fps UI responsiveness.
 * Profiles all stages and avoids redundant canvas roundtrips.
 */
async function runInMainThread(params: {
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
  startTime: number;
  imagePrepMs: number;
  enhancementConfigName: string;
  onProgress: (p: ProcessingProgress) => void;
  abortSignal?: AbortSignal;
}): Promise<UpscaleResult> {
  const stageTimer = new StageTimer();
  stageTimer.set('imagePrep', params.imagePrepMs);

  const modelLoadStart = performance.now();
  const { session, backend, wasCached } = await getOrLoadModelSession(
    params.modelFile,
    (pct, msg) => {
      params.onProgress({
        stage: 'loading-model',
        percent: Math.round(5 + (pct / 100) * 15),
        currentTile: 0,
        totalTiles: 0,
        message: msg,
        timeElapsedMs: Math.round(performance.now() - params.startTime),
        estimatedRemainingMs: 0,
        activeBackend: 'wasm',
      });
    }
  );

  const modelLoadDuration = wasCached ? 0 : Math.round(performance.now() - modelLoadStart);
  stageTimer.set('modelLoad', modelLoadDuration);
  stageTimer.set('sessionInit', wasCached ? 0 : 40);

  if (params.abortSignal?.aborted) {
    throw new Error('Upscaling cancelled by user.');
  }

  const modelScale = 4;
  const { workingW, workingH, targetW, targetH, srcPixels } = params;

  let rawAlpha: Uint8ClampedArray | null = null;
  if (params.hasAlpha) {
    rawAlpha = new Uint8ClampedArray(workingW * workingH);
    for (let i = 0; i < workingW * workingH; i++) {
      rawAlpha[i] = srcPixels[i * 4 + 3];
    }
  }

  const tileSize = determineOptimalTileSize(workingW, workingH, backend);
  const pad = 8;
  const tiles = generateSeamlessTiles(workingW, workingH, tileSize, pad, modelScale);
  const totalTiles = tiles.length;

  const outW4 = workingW * modelScale;
  const outH4 = workingH * modelScale;
  const outCanvas4 = document.createElement('canvas');
  outCanvas4.width = outW4;
  outCanvas4.height = outH4;
  const outCtx4 = outCanvas4.getContext('2d');
  if (!outCtx4) throw new Error('Failed to create canvas context.');

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
    if (params.abortSignal?.aborted) {
      throw new Error('Upscaling cancelled by user.');
    }

    // Yield control to browser event loop so UI animations and clicks remain fluid
    await new Promise((resolve) => setTimeout(resolve, 0));

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

    const tileImgData = outCtx4.createImageData(tile.validW, tile.validH);
    const tilePixels = tileImgData.data;

    for (let vy = 0; vy < tile.validH; vy++) {
      const outY = tile.cropY + vy;
      const origGlobalY = tile.inputY + vy / modelScale;
      const outRowOffset = outY * outPaddedW;

      for (let vx = 0; vx < tile.validW; vx++) {
        const outX = tile.cropX + vx;
        const outIdx = outRowOffset + outX;
        const targetPx = (vy * tile.validW + vx) * 4;

        tilePixels[targetPx] = Math.max(0, Math.min(255, Math.round(outData[outIdx] * 255)));
        tilePixels[targetPx + 1] = Math.max(0, Math.min(255, Math.round(outData[outPlaneSize + outIdx] * 255)));
        tilePixels[targetPx + 2] = Math.max(0, Math.min(255, Math.round(outData[outPlaneSize * 2 + outIdx] * 255)));

        if (rawAlpha) {
          const origGlobalX = tile.inputX + vx / modelScale;
          const x0 = Math.floor(origGlobalX);
          const y0 = Math.floor(origGlobalY);
          const x1 = Math.min(workingW - 1, x0 + 1);
          const y1 = Math.min(workingH - 1, y0 + 1);
          const dx = origGlobalX - x0;
          const dy = origGlobalY - y0;

          const interpA =
            (1 - dx) * (1 - dy) * rawAlpha[y0 * workingW + x0] +
            dx * (1 - dy) * rawAlpha[y0 * workingW + x1] +
            (1 - dx) * dy * rawAlpha[y1 * workingW + x0] +
            dx * dy * rawAlpha[y1 * workingW + x1];

          tilePixels[targetPx + 3] = Math.round(interpA);
        } else {
          tilePixels[targetPx + 3] = 255;
        }
      }
    }

    outCtx4.putImageData(tileImgData, tile.destX, tile.destY);
    tileStitchingMs += Math.round(performance.now() - stitchStart);

    const elapsed = Math.round(performance.now() - params.startTime);
    const progressPct = Math.round(20 + ((i + 1) / totalTiles) * 75);
    const msPerTile = elapsed / (i + 1);
    const remainingMs = Math.round((totalTiles - (i + 1)) * msPerTile);

    params.onProgress({
      stage: 'upscaling',
      percent: progressPct,
      currentTile: i + 1,
      totalTiles,
      message: totalTiles === 1
        ? `AI Super-Resolution processing (${backend.toUpperCase()})...`
        : `Processing tile ${i + 1} of ${totalTiles} (${backend.toUpperCase()})...`,
      timeElapsedMs: elapsed,
      estimatedRemainingMs: remainingMs,
      activeBackend: backend,
    });
  }

  const aiInferenceMs = Math.round(performance.now() - inferenceStart - tileStitchingMs);
  stageTimer.set('aiInference', aiInferenceMs);
  stageTimer.set('tileStitching', tileStitchingMs);

  // Render to final resolution
  const resizeStart = performance.now();
  let finalCanvas: HTMLCanvasElement;
  if (targetW === outW4 && targetH === outH4) {
    finalCanvas = outCanvas4;
  } else {
    finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetW;
    finalCanvas.height = targetH;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) throw new Error('Failed to create target resolution canvas.');
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    finalCtx.drawImage(outCanvas4, 0, 0, targetW, targetH);
  }
  stageTimer.set('finalResize', performance.now() - resizeStart);

  // Apply subtle mode refinement at final resolution only if needed
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

  const blobStart = performance.now();
  return new Promise((resolve) => {
    finalCanvas.toBlob((blob) => {
      stageTimer.set('exportBlob', performance.now() - blobStart);
      const totalMs = Math.round(performance.now() - params.startTime);
      const finalTimings = stageTimer.finish(totalMs);

      params.onProgress({
        stage: 'done',
        percent: 100,
        currentTile: totalTiles,
        totalTiles,
        message: 'Upscaling complete!',
        timeElapsedMs: totalMs,
        estimatedRemainingMs: 0,
        activeBackend: backend,
      });

      if (blob) {
        const persistentUrl = URL.createObjectURL(blob);
        resolve({
          dataUrl: persistentUrl,
          blob,
          width: targetW,
          height: targetH,
          sizeBytes: blob.size,
          processingTimeMs: totalMs,
          scale: params.options.scale,
          mode: params.options.mode,
          backendUsed: backend,
          hasAlpha: params.hasAlpha,
          modelName: params.enhancementConfigName,
          timings: finalTimings,
        });
      } else {
        const dataUrl = finalCanvas.toDataURL('image/png');
        const head = 'data:image/png;base64,';
        const sizeBytes = Math.round(((dataUrl.length - head.length) * 3) / 4);
        resolve({
          dataUrl,
          width: targetW,
          height: targetH,
          sizeBytes,
          processingTimeMs: totalMs,
          scale: params.options.scale,
          mode: params.options.mode,
          backendUsed: backend,
          hasAlpha: params.hasAlpha,
          modelName: params.enhancementConfigName,
          timings: finalTimings,
        });
      }
    }, 'image/png');
  });
}
