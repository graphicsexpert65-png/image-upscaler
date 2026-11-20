import React from 'react';
import { ShieldCheck, ChevronDown } from 'lucide-react';

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
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 xl:px-12 2xl:px-16 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="shrink-0">
            <h2 className="text-lg font-bold tracking-tight">FAQs</h2>
            <p className="mt-0.5 text-xs text-blue-100/65">Common questions</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 flex-1 sm:max-w-4xl">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group border-b border-white/15 py-2">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold text-white">
                  <span>{question}</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-blue-200 transition-transform group-open:rotate-180" />
                </summary>
                <p className="pt-2 pr-5 text-xs leading-5 text-blue-100/70">{answer}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs font-semibold text-white">AI Image Upscaler</p>
          <a href="/about-graphics-expert/" className="text-xs font-semibold text-blue-100 underline underline-offset-4 hover:text-white">About the Creator · Graphics Expert</a>
          <p className="text-[11px] text-blue-200/65 flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> Private browser processing</p>
          <p className="text-[11px] text-blue-200/50">© {new Date().getFullYear()} AI Image Upscaler</p>
        </div>
      </div>
    </footer>
  );
}
