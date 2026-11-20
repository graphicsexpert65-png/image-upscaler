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
    description: 'Maximum fidelity to original. Zero artificial sharpening, beautification, or contrast alteration. Preserves natural skin texture, soft lighting, and authentic details.',
    sharpness: 0.0,
    contrastBalance: 1.0,
  },
  natural: {
    modelFile: '/models/realesr-general-x4v3.onnx',
    name: 'Natural Detail',
    description: 'Subtle photographic enhancement. Micro-contrast is kept gentle to preserve authentic facial identity, skin tone, and natural lines without halos or artificial sharpness.',
    sharpness: 0.08,
    contrastBalance: 1.0,
  },
  sharp: {
    modelFile: '/models/realesr-general-x4v3.onnx',
    name: 'Sharp Detail',
    description: 'Clean edge definition for architectural textures, product lines, and typography without cartoon-like or waxy artifacts.',
    sharpness: 0.18,
    contrastBalance: 1.01,
  },
};

/**
 * Applies subtle, high-grade post-reconstruction refinement according to selected mode.
 * - 'preserve': Leaves pixel tensor 100% pristine.
 * - 'natural': Applies very subtle high-frequency definition with strict halo clamping.
 * - 'sharp': Clean edge definition without unnatural facial reconstruction.
 */
export function applyEnhancementRefinement(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  mode: EnhancementMode,
  strength = 100,
  denoise = 0
) {
  if (mode === 'preserve') {
    return; // 100% pristine output from the neural network
  }

  const { sharpness } = ENHANCEMENT_MODES[mode];
  if (sharpness <= 0) return;

  const copy = new Uint8ClampedArray(data);
  const denoiseAmount = Math.max(0, Math.min(40, denoise)) / 100;

  // Subtle unsharp mask kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0]
  // Weight is conservative to prevent plastic/waxy appearance
  const strengthFactor = Math.max(0, Math.min(1, strength / 100));
  const weight = sharpness * 0.25 * strengthFactor;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const top = copy[((y - 1) * width + x) * 4 + c];
        const bottom = copy[((y + 1) * width + x) * 4 + c];
        const left = copy[(y * width + (x - 1)) * 4 + c];
        const right = copy[(y * width + (x + 1)) * 4 + c];

        const laplacian = 4 * center - top - bottom - left - right;
        const localAverage = (top + bottom + left + right) / 4;
        const denoisedCenter = center * (1 - denoiseAmount) + localAverage * denoiseAmount;
        // Strict delta limit (max ±8) prevents edge halos, ringing, and artificial pores
        const delta = Math.max(-8, Math.min(8, laplacian * weight));
        data[idx + c] = Math.max(0, Math.min(255, Math.round(denoisedCenter + delta)));
      }
    }
  }
}

/**
 * Gently blends the original photo back into 2x Preserve output.
 * This reduces AI-invented facial texture while retaining most super-resolution detail.
 * Only called for 2x + Preserve; other scales and modes remain unchanged.
 */
export function blendOriginalForNatural2x(
  output: Uint8ClampedArray,
  outputWidth: number,
  outputHeight: number,
  original: Uint8ClampedArray,
  originalWidth: number,
  originalHeight: number,
  originalWeight = 0.25
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
