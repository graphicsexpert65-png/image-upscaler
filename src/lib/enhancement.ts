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
    description: 'High-fidelity natural restoration. Accurately preserves skin tones, soft lighting, and original colors without oversharpening.',
    sharpness: 0.0,
    contrastBalance: 1.0,
  },
  natural: {
    modelFile: '/models/realesr-general-x4v3.onnx',
    name: 'Natural Detail',
    description: 'Enhanced texture and micro-contrast synthesis. Ideal for photos, fabric, foliage, architecture, and realistic scenes.',
    sharpness: 0.10,
    contrastBalance: 1.0,
  },
  sharp: {
    modelFile: '/models/realesr-anime-x4.onnx',
    name: 'Sharp Detail',
    description: 'Trained on sharp edges and clean contours. Eliminates blur and restores crisp lines for illustrations, logos, graphics, and text.',
    sharpness: 0.65,
    contrastBalance: 1.1,
  },
};

/**
 * Applies subtle, high-grade post-reconstruction refinement according to selected mode.
 * - 'preserve': Leaves pixel tensor pristine.
 * - 'natural': Applies subtle unsharp mask to mid-frequencies.
 * - 'sharp': Sharpens high-contrast edge gradients without color distortion.
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

  // 3x3 unsharp mask kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0]
  // applied with weight = sharpness * 0.5
  const weight = sharpness * 0.35;

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
        // Limit sharpening to prevent halos
        const delta = Math.max(-12, Math.min(12, laplacian * weight));
        data[idx + c] = Math.max(0, Math.min(255, Math.round(center + delta)));
      }
    }
  }
}
