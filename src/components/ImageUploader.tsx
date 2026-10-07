/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles } from 'lucide-react';
import { generateSampleImages, SampleImage } from '../lib/sampleImages';
import { loadImageInfoFromDataUrl, loadImageInfoFromFile } from '../lib/imageUtils';
import { ImageInfo } from '../types';

interface ImageUploaderProps {
  onImageSelected: (info: ImageInfo) => void;
  onError: (msg: string) => void;
  isProcessing: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  onError,
  isProcessing,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [samples] = useState<SampleImage[]>(() => generateSampleImages());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const info = await loadImageInfoFromFile(file);
      onImageSelected(info);
    } catch (err: any) {
      onError(err?.message || 'Failed to open image file.');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleSelectSample = async (sample: SampleImage) => {
    if (isProcessing) return;
    try {
      const info = await loadImageInfoFromDataUrl(
        sample.dataUrl,
        `${sample.id}.png`,
        Math.round((sample.dataUrl.length * 3) / 4),
        'image/png'
      );
      onImageSelected(info);
    } catch (err: any) {
      onError(err?.message || 'Failed to load sample image.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Dropzone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer select-none ${
          isDragging
            ? 'border-sky-400 bg-sky-500/10'
            : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50 hover:bg-zinc-900/80'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/bmp"
          className="hidden"
          onChange={handleInputChange}
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 mb-4 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-7 h-7 text-sky-400" />
          </div>

          <h3 className="text-base font-medium text-zinc-100 mb-1">
            Drop your image here, or <span className="text-sky-400 underline underline-offset-2">browse</span>
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            Supports PNG, JPG, WEBP, BMP · Full alpha transparency supported
          </p>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>Client-side inference</span>
            <span>·</span>
            <span>Large images supported</span>
            <span>·</span>
            <span>Tiled processing</span>
          </div>
        </div>
      </div>

      {/* Quick Test Samples */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium text-zinc-300">Or test instantly with a sample:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {samples.map((sample) => (
            <button
              key={sample.id}
              type="button"
              disabled={isProcessing}
              onClick={() => handleSelectSample(sample)}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 hover:border-zinc-700 text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 rounded border border-zinc-700 overflow-hidden bg-checkerboard shrink-0">
                <img
                  src={sample.dataUrl}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-sky-400 transition-colors">
                  {sample.title}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  {sample.width}×{sample.height} · {sample.category}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
