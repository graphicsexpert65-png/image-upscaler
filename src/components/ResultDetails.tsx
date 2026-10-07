/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Maximize2, FileCheck, Clock, Zap, Sparkles } from 'lucide-react';
import { ImageInfo, UpscaleResult } from '../types';
import { formatBytes } from '../lib/imageUtils';

interface ResultDetailsProps {
  original: ImageInfo;
  result: UpscaleResult;
}

export const ResultDetails: React.FC<ResultDetailsProps> = ({ original, result }) => {
  const pixelIncrease = Math.round((result.width * result.height) / (original.width * original.height));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
        {/* Resolution */}
        <div className="pt-2 sm:pt-0 sm:px-3 first:px-0">
          <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 mb-1">
            <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Resolution</span>
          </div>
          <div className="font-mono text-xs text-zinc-300">
            <div>Original: {original.width} × {original.height}</div>
            <div className="font-semibold text-sky-300 mt-0.5">
              Upscaled: {result.width} × {result.height} ({pixelIncrease}× pixels)
            </div>
          </div>
        </div>

        {/* File Size */}
        <div className="pt-2 sm:pt-0 sm:px-3">
          <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 mb-1">
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>File Size</span>
          </div>
          <div className="text-xs text-zinc-300">
            <div>Original: {formatBytes(original.sizeBytes)}</div>
            <div className="font-semibold text-emerald-300 mt-0.5">
              Output: {formatBytes(result.sizeBytes)}
            </div>
          </div>
        </div>

        {/* Inference Latency */}
        <div className="pt-2 sm:pt-0 sm:px-3">
          <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Inference Time</span>
          </div>
          <div className="text-xs text-zinc-300">
            <div className="font-semibold text-amber-300">
              {(result.processingTimeMs / 1000).toFixed(2)}s
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Engine: {result.backendUsed.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Model & Mode */}
        <div className="pt-2 sm:pt-0 sm:px-3">
          <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Enhancement Mode</span>
          </div>
          <div className="text-xs text-zinc-300">
            <div className="font-semibold text-purple-300 capitalize">{result.mode} Detail</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Real-ESRGAN {result.scale}×
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
