import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

const faqs = [
  ['Is this AI image upscaler free?', 'Yes. You can use the online upscaler without paying to process and download enhanced images.'],
  ['Are my images uploaded to a server?', 'Image upscaling is performed in your browser. Your image is not uploaded to a server for the enhancement process.'],
  ['Which image formats can I use?', 'The uploader accepts JPG, JPEG, PNG, WebP and BMP files.'],
  ['Can I enlarge a transparent PNG?', 'Yes. PNG images with alpha transparency are supported.'],
  ['What is the difference between 2x, 4x and 8x?', 'These settings multiply both the width and height of the original image by two, four or eight. Available output size can depend on your device and the image dimensions.'],
  ['Will AI fix every blurry photo?', 'No. AI enhancement may improve some blurry or low-resolution pictures, but results vary with the original image and cannot be guaranteed for every photo.'],
];

export function Footer() {
  return (
    <footer className="bg-[#101f3d] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="max-w-3xl mb-9">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-blue-200">
            <Sparkles className="h-4 w-4" /> Help centre
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">FAQs</h2>
          <p className="mt-3 text-sm sm:text-base leading-7 text-blue-100/75">Helpful answers about image enhancement, privacy and file support.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 border-t border-white/15">
          {faqs.map(([question, answer], index) => (
            <article key={question} className="py-6 border-b border-white/15">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xs font-bold text-blue-300">0{index + 1}</span>
                <div>
                  <h3 className="text-base font-semibold text-white">{question}</h3>
                  <p className="mt-2 text-sm leading-7 text-blue-100/70">{answer}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm">AI</div>
            <div>
              <p className="font-semibold text-white">AI Image Upscaler</p>
              <p className="text-xs text-blue-200/70">Enhance images with confidence.</p>
            </div>
          </div>
          <p className="text-xs text-blue-200/60 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Process images privately in your browser</p>
          <p className="text-xs text-blue-200/50">© {new Date().getFullYear()} AI Image Upscaler</p>
        </div>
      </div>
    </footer>
  );
}
