/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Star, Send, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { UpscaleResult } from '../types';
import { DeviceCapabilities } from '../lib/device';

interface FeedbackSectionProps {
  result: UpscaleResult;
  device: DeviceCapabilities | null;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({ result, device }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const deviceCategory = typeof navigator !== 'undefined'
      ? /Mobi|Android/i.test(navigator.userAgent)
        ? 'Mobile'
        : 'Desktop'
      : 'Unknown';

    const payload = {
      rating,
      comment: comment.trim(),
      scale: result.scale,
      mode: result.mode,
      processingTimeMs: result.processingTimeMs,
      backendUsed: result.backendUsed,
      deviceCategory: `${deviceCategory} (${device?.hasWebGPU ? 'WebGPU' : 'WASM'})`,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Server returned an error');
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Feedback submission error:', err);
      setErrorMessage("Couldn't submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-sky-400" />
        <h4 className="text-sm font-semibold text-zinc-100">How was your result?</h4>
      </div>

      {submitted ? (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Thank you for your feedback!</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Star Rating Selection */}
          <div>
            <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-zinc-600 hover:text-amber-400 focus:outline-none transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={`w-5 h-5 transition-transform hover:scale-110 ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    />
                  </button>
                );
              })}
              {rating > 0 && (
                <span className="text-xs text-zinc-400 ml-2 font-mono">
                  {rating} / 5
                </span>
              )}
            </div>
          </div>

          {/* Optional Comment Box */}
          <div className="space-y-1.5">
            <label htmlFor="feedback-comment" className="block text-xs font-medium text-zinc-400">
              Tell us about your experience <span className="text-zinc-500 font-normal">(Optional)</span>
            </label>
            <textarea
              id="feedback-comment"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              placeholder="Image quality, speed, or any problem you noticed..."
              className="w-full text-xs rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 resize-none transition-all disabled:opacity-50"
              maxLength={2000}
            />
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className="py-2 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
