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
  mode: EnhancementMode
) {
  if (mode === 'preserve') {
    return; // 100% pristine output from the neural network
  }

  const { sharpness } = ENHANCEMENT_MODES[mode];
  if (sharpness <= 0) return;

  const copy = new Uint8ClampedArray(data);

  // Subtle unsharp mask kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0]
  // Weight is conservative to prevent plastic/waxy appearance
  const weight = sharpness * 0.25;

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
        // Strict delta limit (max ±8) prevents edge halos, ringing, and artificial pores
        const delta = Math.max(-8, Math.min(8, laplacian * weight));
        data[idx + c] = Math.max(0, Math.min(255, Math.round(center + delta)));
      }
    }
  }
}
