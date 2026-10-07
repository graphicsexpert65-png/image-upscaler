/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ImageInfo } from '../types';

/**
 * Loads an image from a File and returns complete metadata.
 */
export async function loadImageInfoFromFile(file: File): Promise<ImageInfo> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/gif'];
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|bmp|gif)$/i)) {
    throw new Error('Unsupported image format. Please upload a JPG, PNG, WEBP, or BMP file.');
  }

  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImageElement(dataUrl);

  const hasAlpha = checkHasTransparency(img);

  return {
    file,
    name: file.name,
    width: img.naturalWidth,
    height: img.naturalHeight,
    sizeBytes: file.size,
    format: file.type || 'image/png',
    hasAlpha,
    dataUrl,
    aspectRatio: img.naturalWidth / img.naturalHeight,
  };
}

/**
 * Loads an image from a Data URL (e.g. for sample images).
 */
export async function loadImageInfoFromDataUrl(
  dataUrl: string,
  name: string,
  estimatedSizeBytes: number,
  format = 'image/png'
): Promise<ImageInfo> {
  const img = await loadImageElement(dataUrl);
  const hasAlpha = checkHasTransparency(img);

  return {
    name,
    width: img.naturalWidth,
    height: img.naturalHeight,
    sizeBytes: estimatedSizeBytes,
    format,
    hasAlpha,
    dataUrl,
    aspectRatio: img.naturalWidth / img.naturalHeight,
  };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file. The file may be corrupted.'));
    reader.readAsDataURL(file);
  });
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image. The file may be damaged or invalid.'));
    img.src = src;
  });
}

/**
 * Checks if the image has any transparent pixels (alpha < 250).
 */
export function checkHasTransparency(img: HTMLImageElement): boolean {
  const canvas = document.createElement('canvas');
  const maxSampleDim = 256;
  const scale = Math.min(1, maxSampleDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;

  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) {
      return true;
    }
  }
  return false;
}

/**
 * Unpremultiplies color and performs nearest neighbor color bleed
 * to prevent black borders around transparent edges during neural network convolution.
 */
export function bleedTransparentColors(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const total = width * height;
  const result = new Uint8ClampedArray(data);

  // Simple morphological color bleed for fully transparent pixels bordering opaque pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];

      if (alpha === 0) {
        // Look around 4-neighbors for average color
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        const neighbors = [
          [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
        ];

        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = (ny * width + nx) * 4;
            if (data[nIdx + 3] > 10) {
              rSum += data[nIdx];
              gSum += data[nIdx + 1];
              bSum += data[nIdx + 2];
              count++;
            }
          }
        }

        if (count > 0) {
          result[idx] = Math.round(rSum / count);
          result[idx + 1] = Math.round(gSum / count);
          result[idx + 2] = Math.round(bSum / count);
        }
      }
    }
  }

  return new ImageData(result, width, height);
}

/**
 * Resizes an image or canvas with area-averaging downsampling for crisp downscale.
 */
export function downscaleAreaCanvas(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
  return canvas;
}

/**
 * Rescales an alpha channel array using high-quality bilinear interpolation.
 */
export function rescaleAlphaChannel(
  originalData: Uint8ClampedArray,
  origW: number,
  origH: number,
  targetW: number,
  targetH: number
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(targetW * targetH);
  const xRatio = origW / targetW;
  const yRatio = origH / targetH;

  for (let ty = 0; ty < targetH; ty++) {
    const sy = (ty + 0.5) * yRatio - 0.5;
    const y0 = Math.max(0, Math.floor(sy));
    const y1 = Math.min(origH - 1, y0 + 1);
    const yWeight = Math.max(0, Math.min(1, sy - y0));

    for (let tx = 0; tx < targetW; tx++) {
      const sx = (tx + 0.5) * xRatio - 0.5;
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(origW - 1, x0 + 1);
      const xWeight = Math.max(0, Math.min(1, sx - x0));

      const a00 = originalData[(y0 * origW + x0) * 4 + 3];
      const a10 = originalData[(y0 * origW + x1) * 4 + 3];
      const a01 = originalData[(y1 * origW + x0) * 4 + 3];
      const a11 = originalData[(y1 * origW + x1) * 4 + 3];

      const top = a00 * (1 - xWeight) + a10 * xWeight;
      const bottom = a01 * (1 - xWeight) + a11 * xWeight;
      result[ty * targetW + tx] = Math.round(top * (1 - yWeight) + bottom * yWeight);
    }
  }

  return result;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function triggerDownload(
  dataUrlOrBlob: string | Blob,
  filename: string
) {
  const link = document.createElement('a');
  let tempUrl: string | null = null;

  if (typeof dataUrlOrBlob === 'string') {
    link.href = dataUrlOrBlob;
  } else {
    tempUrl = URL.createObjectURL(dataUrlOrBlob);
    link.href = tempUrl;
  }

  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Only revoke if we created a temporary URL specifically for this download
  if (tempUrl) {
    setTimeout(() => {
      try {
        URL.revokeObjectURL(tempUrl!);
      } catch {}
    }, 60000);
  }
}
