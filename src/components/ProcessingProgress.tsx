/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2, XCircle, Clock, Zap } from 'lucide-react';
import { ProcessingProgress as ProgressType } from '../types';

interface ProcessingProgressProps {
  progress: ProgressType;
  onCancel: () => void;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  progress,
  onCancel,
}) => {
  const elapsedSec = (progress.timeElapsedMs / 1000).toFixed(1);
  const remainingSec = progress.estimatedRemainingMs > 0
    ? (progress.estimatedRemainingMs / 1000).toFixed(1)
    : null;

  return (
    <div className="rounded-xl border border-sky-500/30 bg-zinc-900/80 p-5 space-y-4">
      {/* Header & Stage Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span>{progress.message}</span>
            </h4>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              {progress.totalTiles > 0 && (
                <span>
                  Tile {progress.currentTile} of {progress.totalTiles}
                </span>
              )}
              {progress.totalTiles > 0 && <span>·</span>}
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-zinc-500" />
                {elapsedSec}s elapsed
                {remainingSec && ` (est. ~${remainingSec}s left)`}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 hover:bg-red-500/25 active:bg-red-500/30 text-xs font-medium text-red-200 transition-colors shadow-sm cursor-pointer"
        >
          <XCircle className="w-4 h-4 text-red-400" />
          <span>Cancel Processing</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-sky-500 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(4, Math.min(100, progress.percent))}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-zinc-400 mt-1.5">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Backend: {progress.activeBackend.toUpperCase()}
          </span>
          <span className="font-mono font-medium text-sky-400">{progress.percent}%</span>
        </div>
      </div>
    </div>
  );
};
