import React from 'react';
import { ShieldCheck } from 'lucide-react';

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
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 xl:px-12 2xl:px-16 pt-8 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">FAQs</h2>
            <p className="mt-1 text-xs sm:text-sm text-blue-100/70">Quick answers about image enhancement and privacy.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 border-t border-white/15">
          {faqs.map(([question, answer]) => (
            <article key={question} className="py-3 border-b border-white/15">
              <h3 className="text-sm font-semibold text-white">{question}</h3>
              <p className="mt-1 text-xs leading-5 text-blue-100/70">{answer}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">AI Image Upscaler</p>
          <p className="text-xs text-blue-200/65 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Private browser processing</p>
          <p className="text-xs text-blue-200/50">© {new Date().getFullYear()} AI Image Upscaler</p>
        </div>
      </div>
    </footer>
  );
}
