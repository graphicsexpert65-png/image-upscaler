/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Split, Columns, Eye } from 'lucide-react';
import { ImageInfo, UpscaleResult } from '../types';

interface BeforeAfterSliderProps {
  original: ImageInfo;
  result: UpscaleResult;
}
type ViewMode = 'slider' | 'side-by-side' | 'flip';
type ZoomChoice = 'fit' | 1 | 2 | 4;

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ original, result }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('slider');
  const [zoomChoice, setZoomChoice] = useState<ZoomChoice>('fit');
  const [flipState, setFlipState] = useState<'original' | 'upscaled'>('upscaled');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const updateSliderFromPointer = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setSliderPos(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (viewMode !== 'slider') return;
    setIsDragging(true);
    updateSliderFromPointer(e.clientX);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging && viewMode === 'slider') updateSliderFromPointer(e.clientX);
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (viewMode !== 'slider') return;
    if (e.key === 'ArrowLeft') setSliderPos((p) => Math.max(0, p - 5));
    if (e.key === 'ArrowRight') setSliderPos((p) => Math.min(100, p + 5));
  };

  const panelWidth = viewMode === 'side-by-side' ? containerSize.width / 2 : containerSize.width;
  const fitScale = Math.min(
    Math.max(0.01, (panelWidth - 24) / Math.max(1, result.width)),
    Math.max(0.01, (containerSize.height - 24) / Math.max(1, result.height)),
    1
  );
  const zoomScale = zoomChoice === 'fit' ? fitScale : zoomChoice;
  const imageStageStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: result.width,
    height: result.height,
    transform: `translate(-50%, -50%) scale(${zoomScale})`,
    transformOrigin: 'center center',
  };

  const comparisonImage = (src: string, alt: string) => (
    <img
      src={src}
      alt={alt}
      draggable={false}
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }}
    />
  );

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 p-1 rounded-lg border border-zinc-800 bg-zinc-950">
          <button type="button" onClick={() => setViewMode('slider')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${viewMode === 'slider' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
            <Split className="w-3.5 h-3.5 text-sky-400" /><span>Split Slider</span>
          </button>
          <button type="button" onClick={() => setViewMode('side-by-side')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${viewMode === 'side-by-side' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
            <Columns className="w-3.5 h-3.5 text-sky-400" /><span>Side-by-Side</span>
          </button>
          <button type="button" onClick={() => setViewMode('flip')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${viewMode === 'flip' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
            <Eye className="w-3.5 h-3.5 text-sky-400" /><span>Toggle Flip</span>
          </button>
        </div>
        <div className="flex items-center gap-1">
          {(['fit', 1, 2, 4] as ZoomChoice[]).map((choice) => (
            <button key={String(choice)} type="button" onClick={() => setZoomChoice(choice)}
              className={`px-2 py-1 rounded border text-xs font-medium ${zoomChoice === choice ? 'border-zinc-700 bg-zinc-800 text-zinc-100' : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'}`}>
              {choice === 'fit' ? 'Fit' : `${choice * 100}%`}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-full h-[380px] sm:h-[480px] rounded-xl overflow-hidden select-none border border-zinc-800 ${original.hasAlpha ? 'bg-checkerboard' : 'bg-zinc-950'} focus:outline-none focus:ring-1 focus:ring-sky-500`}>
        {viewMode === 'slider' && (
          <>
            <div className="absolute inset-0 overflow-hidden">
              <div style={imageStageStyle}>{comparisonImage(result.dataUrl, 'AI upscaled image')}</div>
            </div>
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
              <div style={imageStageStyle}>{comparisonImage(original.dataUrl, 'Original image')}</div>
            </div>
            <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)] cursor-ew-resize z-20"
              style={{ left: `${sliderPos}%` }}>
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg border border-zinc-200">
                <Split className="w-4 h-4" />
              </div>
            </div>
            <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded bg-black/70 text-[11px] font-semibold text-zinc-300 pointer-events-none">
              Original ({original.width}×{original.height})
            </div>
            <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded bg-sky-950/80 text-[11px] font-semibold text-sky-300 pointer-events-none">
              AI {result.scale}× ({result.width}×{result.height})
            </div>
          </>
        )}

        {viewMode === 'side-by-side' && (
          <div className="absolute inset-0 grid grid-cols-2 divide-x divide-zinc-800">
            <div className="relative overflow-hidden">
              <div style={imageStageStyle}>{comparisonImage(original.dataUrl, 'Original image')}</div>
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/70 text-[10px] font-medium text-zinc-300">Original</div>
            </div>
            <div className="relative overflow-hidden">
              <div style={imageStageStyle}>{comparisonImage(result.dataUrl, 'AI upscaled image')}</div>
              <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded bg-sky-950/80 text-[10px] font-medium text-sky-300">AI Upscaled</div>
            </div>
          </div>
        )}

        {viewMode === 'flip' && (
          <div className="absolute inset-0 overflow-hidden cursor-pointer"
            onClick={() => setFlipState((state) => state === 'upscaled' ? 'original' : 'upscaled')}>
            <div style={imageStageStyle}>
              {comparisonImage(flipState === 'upscaled' ? result.dataUrl : original.dataUrl, 'Image comparison')}
            </div>
            <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded bg-black/80 text-xs font-semibold text-white">
              Showing: {flipState === 'upscaled' ? `AI ${result.scale}× Upscaled` : 'Original Image'} (click to switch)
            </div>
          </div>
        )}
      </div>
      <div className="text-center text-[11px] text-zinc-400">
        Fit shows the full image. 100% displays one output pixel per screen pixel; use 200% or 400% to inspect detail.
      </div>
    </div>
  );
};
