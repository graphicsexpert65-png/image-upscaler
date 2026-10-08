/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MAX_SAFE_CANVAS_DIM = 12288;
export const MAX_SAFE_CANVAS_PIXELS = 64000000; // ~64 Megapixels (~256MB single canvas backing store)
export const MAX_SAFE_TOTAL_RAM_MB = 1200; // 1.2 GB safe peak RAM ceiling across all tensors & buffers

export interface ScaleDimensionInfo {
  requestedWidth: number;
  requestedHeight: number;
  effectiveWidth: number;
  effectiveHeight: number;
  isCapped: boolean;
  effectiveScale: number;
  estMemoryMb: number;
  exceedsSafeLimit: boolean;
  warningMessage?: string;
}

/**
 * Calculates realistic peak memory requirements across the entire pipeline:
 * - Source RGBA buffer
 * - Float32 input/output tile tensors
 * - Intermediate 4x reconstruction canvas
 * - Final target canvas
 * Flags when a scale exceeds browser safety limits and provides clear recommendations.
 */
export function computeSafeScaleDimensions(
  origW: number,
  origH: number,
  scale: number
): ScaleDimensionInfo {
  const reqW = origW * scale;
  const reqH = origH * scale;

  // Realistic peak memory estimation across the pipeline:
  // Source buffer (RGBA) + 4x intermediate canvas + target canvas + tile tensors buffer (~48MB)
  const sourceBytes = origW * origH * 4;
  const model4xBytes = (origW * 4) * (origH * 4) * 4;
  const targetBytes = reqW * reqH * 4;
  const workingTensorsBytes = 48 * 1024 * 1024; // Tensor buffer overhead

  const peakBytes = sourceBytes + model4xBytes + targetBytes + workingTensorsBytes;
  const estMemoryMb = Math.round(peakBytes / (1024 * 1024));

  const exceedsHardwareLimits =
    reqW > MAX_SAFE_CANVAS_DIM ||
    reqH > MAX_SAFE_CANVAS_DIM ||
    reqW * reqH > MAX_SAFE_CANVAS_PIXELS;

  const exceedsSafeLimit = exceedsHardwareLimits || estMemoryMb > MAX_SAFE_TOTAL_RAM_MB;

  if (!exceedsHardwareLimits && !exceedsSafeLimit) {
    return {
      requestedWidth: reqW,
      requestedHeight: reqH,
      effectiveWidth: reqW,
      effectiveHeight: reqH,
      isCapped: false,
      effectiveScale: scale,
      estMemoryMb,
      exceedsSafeLimit: false,
    };
  }

  // Calculate clamp factor if hardware limits are exceeded
  const dimFactor = Math.min(MAX_SAFE_CANVAS_DIM / reqW, MAX_SAFE_CANVAS_DIM / reqH);
  const pixelFactor = Math.sqrt(MAX_SAFE_CANVAS_PIXELS / (reqW * reqH));
  const clampFactor = Math.min(1.0, Math.min(dimFactor, pixelFactor));

  const effW = Math.max(origW, Math.round(reqW * clampFactor));
  const effH = Math.max(origH, Math.round(reqH * clampFactor));
  const effTargetBytes = effW * effH * 4;
  const clampedPeakMb = Math.round((sourceBytes + model4xBytes + effTargetBytes + workingTensorsBytes) / (1024 * 1024));

  const recommendation =
    scale === 8
      ? 'Try 4× or 2× upscaling for this image size.'
      : scale === 4
      ? 'Try 2× upscaling or a slightly smaller image.'
      : 'Try a smaller image to stay within browser hardware limits.';

  return {
    requestedWidth: reqW,
    requestedHeight: reqH,
    effectiveWidth: effW,
    effectiveHeight: effH,
    isCapped: exceedsHardwareLimits,
    effectiveScale: Number((effW / origW).toFixed(2)),
    estMemoryMb: clampedPeakMb,
    exceedsSafeLimit: true,
    warningMessage: `This image is too large for ${scale}× processing in your current browser (${estMemoryMb} MB estimated peak RAM). ${recommendation}`,
  };
}
