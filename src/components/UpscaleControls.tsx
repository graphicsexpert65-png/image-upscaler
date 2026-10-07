/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, ArrowRight, Shield, Wand2, Eye, Info, AlertTriangle } from 'lucide-react';
import { EnhancementMode, UpscaleScale } from '../types';
import { ENHANCEMENT_MODES } from '../lib/enhancement';
import { computeSafeScaleDimensions } from '../lib/canvasLimits';

interface UpscaleControlsProps {
  scale: UpscaleScale;
  onScaleChange: (scale: UpscaleScale) => void;
  mode: EnhancementMode;
  onModeChange: (mode: EnhancementMode) => void;
  originalWidth: number;
  originalHeight: number;
  onStartUpscale: () => void;
  isProcessing: boolean;
}

export const UpscaleControls: React.FC<UpscaleControlsProps> = ({
  scale,
  onScaleChange,
  mode,
  onModeChange,
  originalWidth,
  originalHeight,
  onStartUpscale,
  isProcessing,
}) => {
  const selectedDims = computeSafeScaleDimensions(originalWidth, originalHeight, scale);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-6">
      {/* 1. Scale Selection */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            1. Upscale Factor
          </label>
          <div className="text-xs text-zinc-400 flex items-center gap-1.5 font-mono">
            <span>{originalWidth.toLocaleString()}×{originalHeight.toLocaleString()}</span>
            <ArrowRight className="w-3 h-3 text-sky-400" />
            <span className="text-sky-300 font-semibold">
              {selectedDims.effectiveWidth.toLocaleString()}×{selectedDims.effectiveHeight.toLocaleString()} px
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {([2, 4, 8] as UpscaleScale[]).map((s) => {
            const isSelected = scale === s;
            const dims = computeSafeScaleDimensions(originalWidth, originalHeight, s);

            return (
              <button
                key={s}
                type="button"
                disabled={isProcessing}
                onClick={() => onScaleChange(s)}
                className={`py-3 px-3 rounded-lg border text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed relative ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/15 text-white shadow-sm ring-1 ring-sky-500/50'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-lg font-bold tracking-tight">{s}×</span>
                  {dims.isCapped && (
                    <span className="text-[9px] font-semibold tracking-wide uppercase px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Cap
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                  {dims.effectiveWidth.toLocaleString()} × {dims.effectiveHeight.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  ~{dims.estMemoryMb} MB RAM
                </div>
              </button>
            );
          })}
        </div>

        {selectedDims.warningMessage && (
          <div className="mt-2.5 flex items-start gap-2 p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{selectedDims.warningMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Enhancement Mode Selection */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            2. Enhancement Mode
          </label>
          <span className="text-xs text-zinc-400">
            Affects neural reconstruction & filtering
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(['preserve', 'natural', 'sharp'] as EnhancementMode[]).map((m) => {
            const isSelected = mode === m;
            const config = ENHANCEMENT_MODES[m];
            const Icon = m === 'preserve' ? Shield : m === 'natural' ? Eye : Wand2;

            return (
              <button
                key={m}
                type="button"
                disabled={isProcessing}
                onClick={() => onModeChange(m)}
                className={`p-3 rounded-lg border text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/15 text-white ring-1 ring-sky-500/50'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-zinc-500'}`} />
                  <span className="text-xs font-semibold">{config.name}</span>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {config.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Upscale Button */}
      <button
        type="button"
        disabled={isProcessing}
        onClick={onStartUpscale}
        className="w-full py-3.5 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <Sparkles className="w-4 h-4 fill-zinc-950" />
        <span>
          Upscale to {selectedDims.effectiveWidth.toLocaleString()} × {selectedDims.effectiveHeight.toLocaleString()} px
        </span>
      </button>
    </div>
  );
};
