/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { OriginalPreview } from './components/OriginalPreview';
import { UpscaleControls } from './components/UpscaleControls';
import { ProcessingProgress } from './components/ProcessingProgress';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { ResultDetails } from './components/ResultDetails';
import { DownloadSection } from './components/DownloadSection';
import { Feedback } from './Feedback';
import { ErrorAlert } from './components/ErrorAlert';
import {
  EnhancementMode,
  ImageInfo,
  ProcessingProgress as ProgressType,
  UpscaleResult,
  UpscaleScale,
} from './types';
import { DeviceCapabilities, detectDeviceCapabilities } from './lib/device';
import { runUpscalePipeline } from './lib/inference';
import { terminatePersistentWorker } from './lib/workerClient';

export default function App() {
  const [device, setDevice] = useState<DeviceCapabilities | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [scale, setScale] = useState<UpscaleScale>(4);
  const [mode, setMode] = useState<EnhancementMode>('preserve');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProgressType | null>(null);
  const [result, setResult] = useState<UpscaleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Detect device on mount
  useEffect(() => {
    detectDeviceCapabilities()
      .then((caps) => setDevice(caps))
      .catch((err) => console.warn('Device detection fallback:', err));
  }, []);

  const handleImageSelected = (info: ImageInfo) => {
    if (result?.dataUrl && result.dataUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(result.dataUrl);
      } catch {}
    }
    setImageInfo(info);
    setResult(null);
    setProgress(null);
    setError(null);

    // Auto-select appropriate default scale based on image dimensions
    if (info.width > 2500 || info.height > 2500) {
      setScale(2);
    } else {
      setScale(4);
    }
  };

  const handleClearImage = () => {
    if (isProcessing) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      terminatePersistentWorker();
    }
    if (result?.dataUrl && result.dataUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(result.dataUrl);
      } catch {}
    }
    setImageInfo(null);
    setResult(null);
    setProgress(null);
    setError(null);
  };

  const handleStartUpscale = async () => {
    if (!imageInfo || isProcessing) return;

    setError(null);
    setIsProcessing(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const upscaleResult = await runUpscalePipeline(
        imageInfo,
        { scale, mode },
        (p) => setProgress(p),
        controller.signal
      );
      setResult(upscaleResult);
    } catch (err: any) {
      if (err?.message?.includes('cancelled')) {
        setProgress(null);
      } else {
        console.error('Upscale failed:', err);
        setError(
          err?.message ||
            'Super-resolution processing failed. If the image is extremely large, try a smaller scale or image.'
        );
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    terminatePersistentWorker();
    setIsProcessing(false);
    setProgress(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-sky-500 selection:text-zinc-950">
      <Header device={device} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Error Notification */}
        {error && (
          <ErrorAlert
            message={error}
            onDismiss={() => setError(null)}
            onRetry={imageInfo && !isProcessing ? handleStartUpscale : undefined}
          />
        )}

        {/* 1. Image Upload or Selected Image Preview */}
        {!imageInfo ? (
          <ImageUploader
            onImageSelected={handleImageSelected}
            onError={(msg) => setError(msg)}
            isProcessing={isProcessing}
          />
        ) : (
          <div className="space-y-6">
            {/* Original Image Info Card */}
            <OriginalPreview
              imageInfo={imageInfo}
              onClear={handleClearImage}
              isProcessing={isProcessing}
            />

            {/* Upscale Options & Action */}
            <UpscaleControls
              scale={scale}
              onScaleChange={setScale}
              mode={mode}
              onModeChange={setMode}
              originalWidth={imageInfo.width}
              originalHeight={imageInfo.height}
              onStartUpscale={handleStartUpscale}
              isProcessing={isProcessing}
            />

            {/* Processing Progress */}
            {isProcessing && progress && (
              <ProcessingProgress
                progress={progress}
                onCancel={handleCancel}
              />
            )}

            {/* Before / After Preview & Result Download */}
            {result && !isProcessing && (
              <div className="space-y-6 animate-fade-in">
                <BeforeAfterSlider original={imageInfo} result={result} />
                <ResultDetails original={imageInfo} result={result} />
                <DownloadSection original={imageInfo} result={result} />
                <Feedback />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
