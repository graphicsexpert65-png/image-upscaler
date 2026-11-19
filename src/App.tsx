
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AdBanner } from './components/AdBanner';
import { SEOContent } from './components/SEOContent';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { OriginalPreview } from './components/OriginalPreview';
import { UpscaleControls } from './components/UpscaleControls';
import { ProcessingProgress } from './components/ProcessingProgress';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { ResultDetails } from './components/ResultDetails';
import { DownloadSection } from './components/DownloadSection';
import { FeedbackSection } from './components/FeedbackSection';
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
    <div className="app-shell min-h-screen bg-white text-slate-900 flex flex-col antialiased selection:bg-blue-100 selection:text-slate-950">
      <Header device={device} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <section className="app-intro max-w-3xl mx-auto text-center space-y-3 pb-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold tracking-wide text-slate-700">
            <span className="h-2 w-2 rounded-full bg-blue-900" /> FREE ONLINE AI PHOTO ENHANCER
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-950 leading-tight">Make your images <span className="text-blue-900">clearer and bigger.</span></h2>
          <p className="max-w-2xl mx-auto text-sm sm:text-base leading-7 text-slate-600">Upload a photo, choose 2×, 4× or 8×, and enhance it with AI. Your image is processed in your browser.</p>
        </section>
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
                <FeedbackSection result={result} device={device} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* SEO content below the image upscaler */}
      <SEOContent />

      <AdBanner />
    </div>
  );
}
