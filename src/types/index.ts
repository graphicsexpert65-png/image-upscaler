/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UpscaleScale = 2 | 4 | 8;

export type EnhancementMode = 'preserve' | 'natural' | 'sharp';

export type InferenceBackend = 'webgpu' | 'wasm' | 'cpu';

export type ProcessingStage =
  | 'idle'
  | 'loading-model'
  | 'preparing-tiles'
  | 'upscaling'
  | 'reconstructing'
  | 'refining'
  | 'finalizing'
  | 'done'
  | 'error';

export interface ProcessingProgress {
  stage: ProcessingStage;
  percent: number; // 0 to 100
  currentTile: number;
  totalTiles: number;
  message: string;
  timeElapsedMs: number;
  estimatedRemainingMs: number;
  activeBackend: InferenceBackend;
}

export interface ImageInfo {
  file?: File;
  name: string;
  width: number;
  height: number;
  sizeBytes: number;
  format: string; // 'image/png' | 'image/jpeg' | 'image/webp' etc.
  hasAlpha: boolean;
  dataUrl: string;
  aspectRatio: number;
}

export interface UpscaleResult {
  dataUrl: string;
  blob?: Blob;
  width: number;
  height: number;
  sizeBytes: number;
  processingTimeMs: number;
  scale: UpscaleScale;
  mode: EnhancementMode;
  backendUsed: InferenceBackend;
  hasAlpha: boolean;
  modelName: string;
}

export interface UpscaleOptions {
  scale: UpscaleScale;
  mode: EnhancementMode;
  tileSize?: number;
  overlap?: number;
}
