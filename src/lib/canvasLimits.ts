/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MAX_SAFE_CANVAS_DIM = 12288;
export const MAX_SAFE_CANVAS_PIXELS = 64000000; // ~64 Megapixels (~256MB RGBA buffer)
export const MAX_SAFE_RAM_MB = 500; // Safe threshold for single canvas backing store

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
 * Calculates dimensions and estimated memory requirements before inference.
 * Flags when a scale exceeds browser safety limits and provides the exact recommendation.
 */
export function computeSafeScaleDimensions(
  origW: number,
  origH: number,
  scale: number
): ScaleDimensionInfo {
  const reqW = origW * scale;
  const reqH = origH * scale;
  const estMemoryMb = Math.round((reqW * reqH * 4) / (1024 * 1024));

  const exceedsHardwareLimits =
    reqW > MAX_SAFE_CANVAS_DIM ||
    reqH > MAX_SAFE_CANVAS_DIM ||
    reqW * reqH > MAX_SAFE_CANVAS_PIXELS;

  const exceedsSafeLimit = exceedsHardwareLimits || estMemoryMb > MAX_SAFE_RAM_MB;

  if (!exceedsHardwareLimits) {
    return {
      requestedWidth: reqW,
      requestedHeight: reqH,
      effectiveWidth: reqW,
      effectiveHeight: reqH,
      isCapped: false,
      effectiveScale: scale,
      estMemoryMb,
      exceedsSafeLimit,
      warningMessage: exceedsSafeLimit
        ? `This image is too large for ${scale}× processing in your current browser. Try ${scale === 8 ? '4× or 2×' : '2×'} upscaling or a smaller image.`
        : undefined,
    };
  }

  // Calculate clamp factor
  const dimFactor = Math.min(MAX_SAFE_CANVAS_DIM / reqW, MAX_SAFE_CANVAS_DIM / reqH);
  const pixelFactor = Math.sqrt(MAX_SAFE_CANVAS_PIXELS / (reqW * reqH));
  const clampFactor = Math.min(dimFactor, pixelFactor);

  const effW = Math.max(origW, Math.round(reqW * clampFactor));
  const effH = Math.max(origH, Math.round(reqH * clampFactor));
  const effectiveMemoryMb = Math.round((effW * effH * 4) / (1024 * 1024));

  return {
    requestedWidth: reqW,
    requestedHeight: reqH,
    effectiveWidth: effW,
    effectiveHeight: effH,
    isCapped: true,
    effectiveScale: Number((effW / origW).toFixed(2)),
    estMemoryMb: effectiveMemoryMb,
    exceedsSafeLimit: true,
    warningMessage: `This image is too large for ${scale}× processing in your current browser. Try ${scale === 8 ? '4× or 2×' : '2×'} upscaling or a smaller image.`,
  };
}
