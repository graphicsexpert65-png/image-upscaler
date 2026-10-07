/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SeamlessTile {
  index: number;

  // Unpadded region in input image
  inputX: number;
  inputY: number;
  inputW: number;
  inputH: number;

  // Padded region passed to neural network
  paddedX: number;
  paddedY: number;
  paddedW: number;
  paddedH: number;

  // Region inside model output to extract
  cropX: number;
  cropY: number;
  validW: number;
  validH: number;

  // Target coordinates on output canvas
  destX: number;
  destY: number;
}

/**
 * Determines the largest safe tile size that the current device can process reliably.
 * Reduces the number of inference calls by up to 20x compared to small tiles.
 * - WebGPU: 512x512 (or 1024x1024 on high-memory devices)
 * - WASM: 256x256 to 384x384
 * - Small images: Fast path (single pass, zero tiling overhead)
 */
export function determineOptimalTileSize(
  imgWidth: number,
  imgHeight: number,
  backend: 'webgpu' | 'wasm' | 'cpu',
  deviceMemoryGB?: number | null
): number {
  const maxDim = Math.max(imgWidth, imgHeight);

  // Fast path for small & medium images (up to 512px)
  // Process directly in 1 single tile without tiling overhead!
  if (maxDim <= 512) {
    return maxDim;
  }

  // WebGPU hardware acceleration: use large 512px or 1024px tiles
  if (backend === 'webgpu') {
    if (deviceMemoryGB && deviceMemoryGB >= 8 && maxDim >= 2048) {
      return 1024;
    }
    return 512;
  }

  // WASM backend: 256px to 384px maximizes CPU throughput without exceeding memory
  if (deviceMemoryGB && deviceMemoryGB >= 8) {
    return 384;
  }
  return 256;
}

/**
 * Generates non-overlapping target tiles with padded neural network context.
 * Padded margins (12px) eliminate convolution boundary distortions and seams.
 */
export function generateSeamlessTiles(
  imgWidth: number,
  imgHeight: number,
  tileSize: number = 512,
  pad: number = 12,
  scale: number = 4
): SeamlessTile[] {
  // Fast path: if the image fits within a single tile, return 1 tile covering the entire image
  if (imgWidth <= tileSize && imgHeight <= tileSize) {
    return [
      {
        index: 0,
        inputX: 0,
        inputY: 0,
        inputW: imgWidth,
        inputH: imgHeight,
        paddedX: 0,
        paddedY: 0,
        paddedW: imgWidth,
        paddedH: imgHeight,
        cropX: 0,
        cropY: 0,
        validW: imgWidth * scale,
        validH: imgHeight * scale,
        destX: 0,
        destY: 0,
      },
    ];
  }

  const tiles: SeamlessTile[] = [];
  let index = 0;

  for (let y = 0; y < imgHeight; y += tileSize) {
    const h = Math.min(tileSize, imgHeight - y);

    for (let x = 0; x < imgWidth; x += tileSize) {
      const w = Math.min(tileSize, imgWidth - x);

      // Padded input boundaries (with edge boundary clamping)
      const px0 = Math.max(0, x - pad);
      const py0 = Math.max(0, y - pad);
      const px1 = Math.min(imgWidth, x + w + pad);
      const py1 = Math.min(imgHeight, y + h + pad);

      const paddedW = px1 - px0;
      const paddedH = py1 - py0;

      // Crop coordinates inside the upscaled output tile
      const cropX = (x - px0) * scale;
      const cropY = (y - py0) * scale;
      const validW = w * scale;
      const validH = h * scale;

      tiles.push({
        index: index++,
        inputX: x,
        inputY: y,
        inputW: w,
        inputH: h,
        paddedX: px0,
        paddedY: py0,
        paddedW,
        paddedH,
        cropX,
        cropY,
        validW,
        validH,
        destX: x * scale,
        destY: y * scale,
      });
    }
  }

  return tiles;
}
