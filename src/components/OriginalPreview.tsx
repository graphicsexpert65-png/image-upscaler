/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RefreshCw, FileImage, Maximize2, Layers } from 'lucide-react';
import { ImageInfo } from '../types';
import { formatBytes } from '../lib/imageUtils';

interface OriginalPreviewProps {
  imageInfo: ImageInfo;
  onClear: () => void;
  isProcessing: boolean;
}

export const OriginalPreview: React.FC<OriginalPreviewProps> = ({
  imageInfo,
  onClear,
  isProcessing,
}) => {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Thumbnail & Title */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-16 h-16 rounded-lg border border-zinc-700 overflow-hidden bg-checkerboard shrink-0 relative group">
            <img
              src={imageInfo.dataUrl}
              alt="Original preview"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-100 truncate max-w-[240px] sm:max-w-xs">
                {imageInfo.name}
              </h3>
              {imageInfo.hasAlpha && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Alpha
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 mt-1">
              <span className="flex items-center gap-1 font-mono text-zinc-300">
                <Maximize2 className="w-3 h-3 text-zinc-500" />
                {imageInfo.width} × {imageInfo.height} px
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <FileImage className="w-3 h-3 text-zinc-500" />
                {formatBytes(imageInfo.sizeBytes)}
              </span>
              <span>·</span>
              <span className="uppercase text-zinc-500 text-[11px] font-mono">
                {imageInfo.format.replace('image/', '')}
              </span>
            </div>
          </div>
        </div>

        {/* Change Image Button */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 text-xs font-medium text-zinc-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Change Image</span>
        </button>
      </div>
    </div>
  );
};
