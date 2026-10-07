/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InferenceBackend } from '../types';

export interface DeviceCapabilities {
  hasWebGPU: boolean;
  recommendedBackend: InferenceBackend;
  hardwareConcurrency: number;
  deviceMemoryGB: number | null;
  gpuRendererInfo?: string;
}

let cachedCapabilities: DeviceCapabilities | null = null;

export async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  if (cachedCapabilities) {
    return cachedCapabilities;
  }

  let hasWebGPU = false;
  let gpuRendererInfo: string | undefined;

  try {
    if (typeof navigator !== 'undefined' && 'gpu' in navigator && (navigator as any).gpu) {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (adapter) {
        hasWebGPU = true;
        if (adapter.info) {
          gpuRendererInfo = adapter.info.vendor || adapter.info.architecture || 'WebGPU Device';
        }
      }
    }
  } catch (err) {
    console.warn('WebGPU detection encountered issue, will use WASM fallback:', err);
    hasWebGPU = false;
  }

  const hardwareConcurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const deviceMemoryGB = typeof navigator !== 'undefined' && 'deviceMemory' in navigator
    ? (navigator as any).deviceMemory || null
    : null;

  cachedCapabilities = {
    hasWebGPU,
    recommendedBackend: hasWebGPU ? 'webgpu' : 'wasm',
    hardwareConcurrency,
    deviceMemoryGB,
    gpuRendererInfo,
  };

  return cachedCapabilities;
}
