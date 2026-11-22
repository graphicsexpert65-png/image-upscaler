/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnhancementMode } from '../types';

export interface EnhancementConfig {
  modelFile: string;
  name: string;
  description: string;
  sharpness: number; // 0 (pure) to 1 (sharpened)
  contrastBalance: number;
}

export const ENHANCEMENT_MODES: Record<EnhancementMode, EnhancementConfig> = {
  preserve: {
    modelFile: '/models/realesr-general-x4v3.onnx',
    name: 'Preserve Original',
    description: 'Uses the lightweight Real-ESRGAN General x4v3 model with restrained finishing for general photos.',
    sharpness: 0.12,
    contrastBalance: 1.0,
  },
  natural: {
    modelFile: '/models/realesr-general-x4v3.onnx',
    name: 'Natural Detail',
    description: 'Same Real-ESRGAN General x4v3 reconstruction with a moderate finishing filter for photos.',
    sharpness: 0.20,
    contrastBalance: 1.0,
  },
  sharp: {
    modelFile: '/models/realesr-general-x4v3.onnx',
    name: 'Sharp Detail',
    description: 'Same Real-ESRGAN General x4v3 reconstruction with stronger edge sharpening for graphics, products, and architecture. Fine halos may appear on some photos.',
    sharpness: 0.32,
    contrastBalance: 1.01,
  },
};

/**
 * Applies restrained refinement after AI reconstruction.
 * Natural/Preserve still responds to strength and denoise controls.
 * Denoising uses luminance-guided neighbour weights to avoid averaging across edges.
 */
export function applyEnhancementRefinement(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  mode: EnhancementMode,
  strength = 100,
  denoise = 0
) {
  const { sharpness } = ENHANCEMENT_MODES[mode];
  const strengthFactor = Math.max(0, Math.min(1, strength / 100));
  const denoiseAmount = Math.max(0, Math.min(40, denoise)) / 100;
  const sharpenWeight = sharpness * 0.25 * strengthFactor;
  if (sharpenWeight <= 0 && denoiseAmount <= 0) return;
  if (width < 3 || height < 3 || data.length !== width * height * 4) return;

  // One source snapshot is required so neighbouring pixels are read consistently.
  // Avoid per-pixel arrays/reduce callbacks: this path can process tens of millions of pixels.
  const source = new Uint8ClampedArray(data);
  const rowStride = width * 4;
  const luminance = (i: number) =>
    source[i] * 0.2126 + source[i + 1] * 0.7152 + source[i + 2] * 0.0722;

  for (let y = 1; y < height - 1; y++) {
    let idx = (y * width + 1) * 4;
    for (let x = 1; x < width - 1; x++, idx += 4) {
      const up = idx - rowStride;
      const down = idx + rowStride;
      const left = idx - 4;
      const right = idx + 4;
      let wUp = 0, wDown = 0, wLeft = 0, wRight = 0, weightSum = 1;
      if (denoiseAmount > 0) {
        const centerLum = luminance(idx);
        const lumUp = luminance(up);
        const lumDown = luminance(down);
        const lumLeft = luminance(left);
        const lumRight = luminance(right);
        wUp = 1 / (1 + ((Math.abs(centerLum - lumUp) / 20) ** 2));
        wDown = 1 / (1 + ((Math.abs(centerLum - lumDown) / 20) ** 2));
        wLeft = 1 / (1 + ((Math.abs(centerLum - lumLeft) / 20) ** 2));
        wRight = 1 / (1 + ((Math.abs(centerLum - lumRight) / 20) ** 2));
        weightSum = wUp + wDown + wLeft + wRight;
      }

      for (let c = 0; c < 3; c++) {
        const center = source[idx + c];
        let value = center;
        if (denoiseAmount > 0) {
          const average = (
            source[up + c] * wUp +
            source[down + c] * wDown +
            source[left + c] * wLeft +
            source[right + c] * wRight
          ) / weightSum;
          value += (average - center) * denoiseAmount;
        }
        if (sharpenWeight > 0) {
          const laplacian = 4 * center - source[up + c] - source[down + c] - source[left + c] - source[right + c];
          value += Math.max(-6, Math.min(6, laplacian * sharpenWeight));
        }
        data[idx + c] = Math.max(0, Math.min(255, Math.round(value)));
      }
      data[idx + 3] = source[idx + 3];
    }
  }
}

/**
 * Adds a restrained amount of source-image information back into Preserve output.
 * This reduces AI-invented facial texture while retaining most super-resolution detail.
 * Called only for Preserve mode; blend strength is scale-dependent in the inference pipeline.
 */
export function blendOriginalForNaturalOutput(
  output: Uint8ClampedArray,
  outputWidth: number,
  outputHeight: number,
  original: Uint8ClampedArray,
  originalWidth: number,
  originalHeight: number,
  originalWeight = 0.04
) {
  if (
    output.length !== outputWidth * outputHeight * 4 ||
    original.length !== originalWidth * originalHeight * 4 ||
    outputWidth <= 0 || outputHeight <= 0 || originalWidth <= 0 || originalHeight <= 0
  ) return;

  const weight = Math.max(0, Math.min(0.35, originalWeight));
  const aiWeight = 1 - weight;
  for (let y = 0; y < outputHeight; y++) {
    const sy = ((y + 0.5) * originalHeight) / outputHeight - 0.5;
    const y0 = Math.max(0, Math.floor(sy));
    const y1 = Math.min(originalHeight - 1, y0 + 1);
    const fy = Math.max(0, sy - y0);
    for (let x = 0; x < outputWidth; x++) {
      const sx = ((x + 0.5) * originalWidth) / outputWidth - 0.5;
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(originalWidth - 1, x0 + 1);
      const fx = Math.max(0, sx - x0);
      const outIdx = (y * outputWidth + x) * 4;
      const p00 = (y0 * originalWidth + x0) * 4;
      const p10 = (y0 * originalWidth + x1) * 4;
      const p01 = (y1 * originalWidth + x0) * 4;
      const p11 = (y1 * originalWidth + x1) * 4;
      for (let c = 0; c < 3; c++) {
        const top = original[p00 + c] * (1 - fx) + original[p10 + c] * fx;
        const bottom = original[p01 + c] * (1 - fx) + original[p11 + c] * fx;
        const sourceValue = top * (1 - fy) + bottom * fy;
        output[outIdx + c] = Math.round(output[outIdx + c] * aiWeight + sourceValue * weight);
      }
    }
  }
}
