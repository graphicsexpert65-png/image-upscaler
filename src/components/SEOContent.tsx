import React from 'react';

const guideSteps = [
  'Select an image from your device or drag it into the upload area.',
  'Choose an enlargement level: 2x, 4x or 8x.',
  'Select the enhancement style that best suits your image.',
  'Start processing and wait for the result.',
  'Compare the original and enhanced image, then download the result.',
];

const faqs = [
  {
    question: 'Is this AI image upscaler free?',
    answer: 'Yes. You can use the online upscaler without paying to process and download enhanced images.',
  },
  {
    question: 'Are my images uploaded to a server?',
    answer: 'Image upscaling is performed in your browser. Your image is not uploaded to a server for the enhancement process.',
  },
  {
    question: 'Which image formats can I use?',
    answer: 'The uploader accepts JPG, JPEG, PNG, WebP and BMP files.',
  },
  {
    question: 'Can I enlarge a transparent PNG?',
    answer: 'Yes. PNG images with alpha transparency are supported.',
  },
  {
    question: 'What is the difference between 2x, 4x and 8x?',
    answer: 'These settings multiply both the width and height of the original image by two, four or eight. Available output size can depend on your device and the image dimensions.',
  },
  {
    question: 'Will AI fix every blurry photo?',
    answer: 'No. AI enhancement may improve some blurry or low-resolution pictures, but results vary with the original image and cannot be guaranteed for every photo.',
  },
];

const sectionClass = 'rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm';
const headingClass = 'text-xl sm:text-2xl font-bold tracking-tight text-[#14264b]';
const paragraphClass = 'text-sm sm:text-base leading-7 text-slate-600';

export function SEOContent() {
  return (
    <section
      aria-labelledby="image-upscaler-guide"
      className="w-full bg-slate-50 border-y border-slate-200 mt-12"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-6 sm:space-y-8">
        <header className="max-w-3xl mx-auto text-center space-y-3 mb-8 sm:mb-10">
          <span className="inline-flex rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold tracking-wider text-[#14264b] uppercase">
            Image Upscaler Guide
          </span>
          <h2 id="image-upscaler-guide" className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#14264b]">
            Get More Detail from Your Images with AI
          </h2>
          <p className={paragraphClass}>
            Learn how to enlarge images, choose the right upscale setting and get the best results from our free online AI image upscaler.
          </p>
        </header>

        <div className={sectionClass}>
          <h3 className={headingClass + ' mb-3'}>Free AI Image Upscaler – Enlarge Images Online</h3>
          <p className={paragraphClass}>
            Increase image resolution with this free online AI image upscaler. Powered by Real-ESRGAN super-resolution models, the tool can enlarge photos, digital artwork and graphics by 2x, 4x or 8x. Processing runs in your browser, so your selected image is not sent to a server for upscaling.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <article className={sectionClass}>
            <h3 className={headingClass + ' mb-5'}>How to Upscale an Image Online</h3>
            <ol className="space-y-4">
              {guideSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#14264b] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-6 text-slate-600 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </article>

          <article className={sectionClass}>
            <h3 className={headingClass + ' mb-3'}>What Does AI Image Upscaling Do?</h3>
            <p className={paragraphClass}>
              AI image upscaling uses a trained neural network to estimate details when enlarging a picture. Real-ESRGAN is designed for image super-resolution and can improve the appearance of many low-resolution photos and graphics. The result depends on the source image; AI cannot always recover details that were never present.
            </p>
          </article>
        </div>

        <article className={sectionClass}>
          <h3 className={headingClass + ' mb-2'}>Choose 2x, 4x or 8x Upscaling</h3>
          <p className={paragraphClass + ' mb-5'}>
            Select the enlargement level that suits your image and the output size you need.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-2xl font-bold text-[#14264b] mb-1">2x</p>
              <p className="text-sm leading-6 text-slate-600">Doubles the image width and height.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-2xl font-bold text-[#14264b] mb-1">4x</p>
              <p className="text-sm leading-6 text-slate-600">Makes both image dimensions four times larger.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-2xl font-bold text-[#14264b] mb-1">8x</p>
              <p className="text-sm leading-6 text-slate-600">Makes both dimensions eight times larger, subject to device and output-size limits.</p>
            </div>
          </div>
          <p className={paragraphClass + ' mt-5'}>
            Larger output images require more memory and processing time. If your device struggles with a large image, try a lower enlargement level.
          </p>
        </article>

        <article className={sectionClass}>
          <h3 className={headingClass + ' mb-3'}>Supported Image Formats</h3>
          <p className={paragraphClass}>
            Upload JPG, JPEG, PNG, WebP or BMP images. Transparent PNG artwork is supported, including alpha transparency. The tool works in a modern browser without requiring desktop image-editing software.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            {['JPG', 'JPEG', 'PNG', 'WebP', 'BMP'].map((format) => (
              <span key={format} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#14264b]">
                {format}
              </span>
            ))}
          </div>
        </article>

        <section className={sectionClass} aria-labelledby="upscaler-faq">
          <div className="mb-6">
            <h3 id="upscaler-faq" className={headingClass}>Frequently Asked Questions</h3>
            <p className="text-sm text-slate-500 mt-2">Quick answers about image quality, privacy and supported formats.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {faqs.map((faq) => (
              <article key={faq.question} className="border-b border-slate-100 pb-5 last:border-0">
                <h4 className="font-semibold text-[#14264b] mb-2">{faq.question}</h4>
                <p className="text-sm leading-7 text-slate-600">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
