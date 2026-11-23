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
  detail: number; // local-contrast boost amount (0 = off)
  grain: number; // luminance grain amplitude in 8-bit levels (0 = off)
  contrastBalance: number;
}

export const ENHANCEMENT_MODES: Record<EnhancementMode, EnhancementConfig> = {
  preserve: {
    modelFile: '/models/realesr-general-x4v3.onnx',
    name: 'Preserve Original',
    description: 'Maximum fidelity to original. Zero artificial sharpening, beautification, or contrast alteration. Preserves natural skin texture, soft lighting, and authentic details.',
    sharpness: 0.0,
    detail: 0,
    grain: 0,
    contrastBalance: 1.0,
  },
  natural: {
    modelFile: '/models/realesr-general-x4v3.onnx',
    name: 'Natural Detail',
    description: 'Restores natural texture. The AI model tends to over-smooth, so this adds gentle micro-detail and fine film-like grain to avoid a plastic look.',
    sharpness: 0.08,
    detail: 0.7,
    grain: 2.2,
    contrastBalance: 1.0,
  },
  sharp: {
    modelFile: '/models/realesr-general-x4v3.onnx',
    name: 'Sharp Detail',
    description: 'Clean edge definition for architectural textures, product lines, and typography without cartoon-like or waxy artifacts.',
    sharpness: 0.18,
    detail: 1.1,
    grain: 1.6,
    contrastBalance: 1.01,
  },
};

function hash2(x: number, y: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) / 4294967295) * 2 - 1; // -1..1
}

/**
 * Post-processing against the "plastic" look of compact super-resolution models.
 * - 'preserve': untouched network output.
 * - 'natural' / 'sharp': small-radius local-contrast boost (blur-difference, clamped to avoid
 *   halos) plus deterministic luminance grain, stronger in midtones than in pure black/white.
 */
export function applyEnhancementRefinement(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  mode: EnhancementMode
) {
  if (mode === 'preserve') return;
  const { detail, grain } = ENHANCEMENT_MODES[mode];
  if (detail <= 0 && grain <= 0) return;

  const src = new Uint8ClampedArray(data);
  const W = width;
  const maxDelta = 14;

  for (let y = 0; y < height; y++) {
    const ym = y > 0 ? y - 1 : 0;
    const yp = y < height - 1 ? y + 1 : height - 1;
    for (let x = 0; x < width; x++) {
      const xm = x > 0 ? x - 1 : 0;
      const xp = x < width - 1 ? x + 1 : width - 1;
      const idx = (y * W + x) * 4;

      // Luma of the pixel for the grain midtone weight
      const lum = (src[idx] * 0.299 + src[idx + 1] * 0.587 + src[idx + 2] * 0.114) / 255;
      const noise =
        grain > 0
          ? (0.6 * hash2(x >> 1, y >> 1) + 0.4 * hash2(x, y)) * grain * (0.35 + 0.65 * 4 * lum * (1 - lum))
          : 0;

      for (let c = 0; c < 3; c++) {
        const center = src[idx + c];
        let delta = noise;
        if (detail > 0) {
          // 3x3 binomial blur [1 2 1; 2 4 2; 1 2 1] / 16
          const blur =
            (src[(ym * W + xm) * 4 + c] + 2 * src[(ym * W + x) * 4 + c] + src[(ym * W + xp) * 4 + c] +
              2 * src[(y * W + xm) * 4 + c] + 4 * center + 2 * src[(y * W + xp) * 4 + c] +
              src[(yp * W + xm) * 4 + c] + 2 * src[(yp * W + x) * 4 + c] + src[(yp * W + xp) * 4 + c]) / 16;
          const d = (center - blur) * detail;
          delta += d > maxDelta ? maxDelta : d < -maxDelta ? -maxDelta : d;
        }
        data[idx + c] = Math.round(center + delta); // Uint8ClampedArray clamps 0..255
      }
    }
  }
}
