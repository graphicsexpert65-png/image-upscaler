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
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-4 py-3 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-sm">
            AI
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-100 tracking-tight leading-none">
              Real-ESRGAN Super-Resolution
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Client-side neural network upscaling · 100% private & local
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero server upload</span>
          </div>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-zinc-300">
            {device?.hasWebGPU ? (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                <span className="font-medium text-amber-300">GPU acceleration enabled</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-medium text-zinc-300">WASM acceleration enabled</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
