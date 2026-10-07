/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, FileImage, Sparkles, Check } from 'lucide-react';
import { ImageInfo, UpscaleResult } from '../types';
import { triggerDownload } from '../lib/imageUtils';

interface DownloadSectionProps {
  original: ImageInfo;
  result: UpscaleResult;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({
  original,
  result,
}) => {
  const [jpgQuality, setJpgQuality] = useState<number>(0.95);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const baseFileName = original.name.replace(/\.[^/.]+$/, '');

  const handleDownloadPng = async () => {
    setIsExporting(true);
    try {
      const filename = `${baseFileName}_upscaled_${result.scale}x_${result.mode}.png`;
      triggerDownload(result.blob || result.dataUrl, filename);
      setDownloadSuccess('PNG saved successfully!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJpg = async () => {
    setIsExporting(true);
    try {
      // Draw to canvas and export with selected JPEG quality
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = result.dataUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = result.width;
      canvas.height = result.height;
      const ctx = canvas.getContext('2d')!;

      // White background for JPEG if transparent
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, result.width, result.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const filename = `${baseFileName}_upscaled_${result.scale}x_q${Math.round(
              jpgQuality * 100
            )}.jpg`;
            triggerDownload(blob, filename);
            setDownloadSuccess(`JPG (Q${Math.round(jpgQuality * 100)}) saved!`);
            setTimeout(() => setDownloadSuccess(null), 3500);
          }
          setIsExporting(false);
        },
        'image/jpeg',
        jpgQuality
      );
    } catch (err) {
      console.error('Failed to export JPG:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Download High-Resolution Image
        </h4>
        {downloadSuccess && (
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            {downloadSuccess}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* PNG Button */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3.5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <FileImage className="w-4 h-4 text-sky-400" />
                PNG (Lossless)
              </span>
              <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                Recommended
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Preserves maximum fine detail and alpha transparency. Exact dimensions: {result.width} × {result.height} px.
            </p>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadPng}
            className="w-full py-2.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download High-Res PNG</span>
          </button>
        </div>

        {/* JPG Button with Quality Option */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3.5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <FileImage className="w-4 h-4 text-amber-400" />
                JPG (Compressed)
              </span>
              {/* Quality Selector */}
              <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setJpgQuality(0.9)}
                  className={`px-1.5 py-0.5 rounded ${
                    jpgQuality === 0.9 ? 'bg-zinc-800 text-amber-300 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  90%
                </button>
                <button
                  type="button"
                  onClick={() => setJpgQuality(0.95)}
                  className={`px-1.5 py-0.5 rounded ${
                    jpgQuality === 0.95 ? 'bg-zinc-800 text-amber-300 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  95%
                </button>
                <button
                  type="button"
                  onClick={() => setJpgQuality(1.0)}
                  className={`px-1.5 py-0.5 rounded ${
                    jpgQuality === 1.0 ? 'bg-zinc-800 text-amber-300 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  100%
                </button>
              </div>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Standard JPEG compression for compact file sizes. Solid white background for transparent areas.
            </p>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadJpg}
            className="w-full py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-750 text-zinc-100 font-semibold text-xs flex items-center justify-center gap-2 border border-zinc-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JPG ({Math.round(jpgQuality * 100)}% Quality)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
