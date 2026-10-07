import React, { useState } from 'react';

export function Feedback() {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) return;

    // Temporary local save
    const existing = JSON.parse(localStorage.getItem('upscaler_feedback') || '[]');

    existing.push({
      rating,
      feedback,
      date: new Date().toISOString(),
    });

    localStorage.setItem('upscaler_feedback', JSON.stringify(existing));

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <div className="text-3xl mb-2">⭐</div>
        <h3 className="text-lg font-semibold text-white">
          Thanks for your feedback!
        </h3>
        <p className="text-sm text-zinc-400 mt-1">
          Your feedback helps us improve the tool.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="text-lg font-semibold text-white text-center">
        How was your experience?
      </h3>

      <p className="text-sm text-zinc-400 text-center mt-1">
        Rate our AI Image Upscaler
      </p>

      <div className="flex justify-center gap-2 mt-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-3xl transition ${
              star <= rating ? 'text-yellow-400' : 'text-zinc-600'
            }`}
            aria-label={`Rate ${star} stars`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Tell us what you think..."
        className="w-full mt-5 min-h-24 rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-sky-500"
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!rating}
        className="w-full mt-4 rounded-xl bg-sky-500 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Send Feedback
      </button>
    </div>
  );
}
