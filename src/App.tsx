
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AdBanner } from './components/AdBanner';
import { SEOContent } from './components/SEOContent';
import { Footer } from './components/Footer';

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
  const [strength, setStrength] = useState<number>(55);
  const [denoise, setDenoise] = useState<number>(0);
  const [faceEnhancement, setFaceEnhancement] = useState<boolean>(false);
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
        { scale, mode, strength, denoise, faceEnhancement },
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

      <main className="flex-1 max-w-screen-2xl w-full mx-auto px-4 sm:px-8 xl:px-12 2xl:px-16 py-8 sm:py-12 space-y-8">
        <section className="app-intro relative max-w-4xl mx-auto overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/70 px-5 py-9 sm:px-10 sm:py-12 text-center shadow-sm">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-2 text-[11px] sm:text-xs font-bold tracking-[0.16em] text-blue-950 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-700 shadow-[0_0_0_4px_rgba(29,78,216,0.10)]" />
              AI IMAGE UPSCALER
            </span>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.045em] leading-[1.08] text-slate-950">
              Sharper images.<br />
              <span className="bg-gradient-to-r from-blue-950 via-blue-800 to-indigo-600 bg-clip-text text-transparent">Bigger possibilities.</span>
            </h2>
            <p className="mt-5 max-w-2xl mx-auto text-sm sm:text-base leading-7 text-slate-600">
              Turn low-resolution photos into high-resolution images with AI. Choose 2×, 4× or 8× enlargement — right in your browser.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">2× · 4× · 8× Upscaling</span>
              <span className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">Private browser processing</span>
              <span className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">Free to use</span>
            </div>
          </div>
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
              strength={strength}
              onStrengthChange={setStrength}
              denoise={denoise}
              onDenoiseChange={setDenoise}
              faceEnhancement={faceEnhancement}
              onFaceEnhancementChange={setFaceEnhancement}
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
      <Footer />
    </div>
  );
}
