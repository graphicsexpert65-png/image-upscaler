/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Split,
  Columns,
  Eye,
  Check,
} from 'lucide-react';
import { ImageInfo, UpscaleResult } from '../types';

interface BeforeAfterSliderProps {
  original: ImageInfo;
  result: UpscaleResult;
}

type ViewMode = 'slider' | 'side-by-side' | 'flip';

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  original,
  result,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100%
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('slider');
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = fit, 2 = 2x, 4 = 4x
  const [flipState, setFlipState] = useState<'original' | 'upscaled'>('upscaled');

  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (viewMode !== 'slider') return;
    setIsDragging(true);
    updateSliderFromPointer(e.clientX);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const updateSliderFromPointer = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || viewMode !== 'slider') return;
    updateSliderFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
  };

  // Keyboard navigation for slider
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (viewMode !== 'slider') return;
    if (e.key === 'ArrowLeft') {
      setSliderPos((p) => Math.max(0, p - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPos((p) => Math.min(100, p + 5));
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* View Mode Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-lg border border-zinc-800 bg-zinc-950">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'slider'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Split className="w-3.5 h-3.5 text-sky-400" />
            <span>Split Slider</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'side-by-side'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-sky-400" />
            <span>Side-by-Side</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('flip')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'flip'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>Toggle Flip</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className={`px-2 py-1 rounded border text-xs font-medium transition-colors ${
              zoomLevel === 1
                ? 'border-zinc-700 bg-zinc-800 text-zinc-100'
                : 'border-zinc-850 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Fit
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(2)}
            className={`px-2 py-1 rounded border text-xs font-medium transition-colors ${
              zoomLevel === 2
                ? 'border-zinc-700 bg-zinc-800 text-zinc-100'
                : 'border-zinc-850 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            200% Zoom
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(4)}
            className={`px-2 py-1 rounded border text-xs font-medium transition-colors ${
              zoomLevel === 4
                ? 'border-zinc-700 bg-zinc-800 text-zinc-100'
                : 'border-zinc-850 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            400% Zoom
          </button>
        </div>
      </div>

      {/* Main Comparison Area */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`relative w-full h-[380px] sm:h-[480px] rounded-xl overflow-hidden select-none border border-zinc-800 ${
          original.hasAlpha ? 'bg-checkerboard' : 'bg-zinc-950'
        } focus:outline-none focus:ring-1 focus:ring-sky-500`}
      >
        {viewMode === 'slider' && (
          <>
            {/* AI Upscaled Layer (Full Background) */}
            <div
              className="absolute inset-0 flex items-center justify-center overflow-auto"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={result.dataUrl}
                alt="AI Upscaled"
                className="max-w-full max-h-full object-contain pointer-events-none"
              />
            </div>

            {/* Original Layer (Clipped to Slider Position) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
              }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                }}
              >
                {/* CSS image-rendering: pixelated ensures the original lower resolution is visible without blur */}
                <img
                  src={original.dataUrl}
                  alt="Original"
                  className="max-w-full max-h-full object-contain pointer-events-none"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </div>

            {/* Draggable Divider Line & Handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)] cursor-ew-resize z-20"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg border border-zinc-200">
                <Split className="w-4 h-4" />
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded bg-black/70 backdrop-blur text-[11px] font-semibold text-zinc-300 pointer-events-none border border-white/10">
              Original ({original.width}×{original.height})
            </div>
            <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded bg-sky-950/80 backdrop-blur text-[11px] font-semibold text-sky-300 pointer-events-none border border-sky-400/20">
              AI {result.scale}× Upscaled ({result.width}×{result.height})
            </div>
          </>
        )}

        {viewMode === 'side-by-side' && (
          <div className="absolute inset-0 grid grid-cols-2 divide-x divide-zinc-800 overflow-auto">
            {/* Left: Original */}
            <div className="relative flex items-center justify-center p-2">
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/70 text-[10px] font-medium text-zinc-300">
                Original ({original.width}×{original.height})
              </div>
              <img
                src={original.dataUrl}
                alt="Original"
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: `scale(${zoomLevel})`,
                  imageRendering: 'pixelated',
                }}
              />
            </div>

            {/* Right: Upscaled */}
            <div className="relative flex items-center justify-center p-2">
              <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded bg-sky-950/80 text-[10px] font-medium text-sky-300">
                AI Upscaled ({result.width}×{result.height})
              </div>
              <img
                src={result.dataUrl}
                alt="AI Upscaled"
                className="max-w-full max-h-full object-contain"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>
          </div>
        )}

        {viewMode === 'flip' && (
          <div
            onClick={() =>
              setFlipState((s) => (s === 'upscaled' ? 'original' : 'upscaled'))
            }
            className="absolute inset-0 flex items-center justify-center cursor-pointer p-4"
          >
            <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded bg-black/80 backdrop-blur text-xs font-semibold text-white border border-white/10 flex items-center gap-2">
              <span>Showing:</span>
              <span className={flipState === 'upscaled' ? 'text-sky-400' : 'text-amber-400'}>
                {flipState === 'upscaled'
                  ? `AI ${result.scale}× Upscaled`
                  : 'Original Image'}
              </span>
              <span className="text-[10px] text-zinc-400 font-normal">(Click anywhere to flip)</span>
            </div>

            <img
              src={flipState === 'upscaled' ? result.dataUrl : original.dataUrl}
              alt="Flip preview"
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${zoomLevel})`,
                imageRendering: flipState === 'original' ? 'pixelated' : 'auto',
              }}
            />
          </div>
        )}
      </div>

      <div className="text-center text-[11px] text-zinc-400">
        Drag slider left or right to inspect sub-pixel AI neural reconstruction.
      </div>
    </div>
  );
};
