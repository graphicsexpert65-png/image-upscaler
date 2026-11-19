
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cpu, Zap, ShieldCheck } from 'lucide-react';
import { DeviceCapabilities } from '../lib/device';

interface HeaderProps {
  device: DeviceCapabilities | null;
}

export const Header: React.FC<HeaderProps> = ({ device }) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-900 flex items-center justify-center text-white font-bold text-sm">
            AI
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-950 tracking-tight leading-none">
              AI Image Upscaler
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enhance photos online with AI · 2×, 4× &amp; 8×
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero server upload</span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-slate-700">
            {device?.hasWebGPU ? (
              <>
                <Zap className="w-3.5 h-3.5 text-blue-900 fill-amber-400/20" />
                <span className="font-medium text-blue-950">
                  GPU acceleration enabled
                </span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-blue-900" />
                <span className="font-medium text-zinc-300">
                  WASM acceleration enabled
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
