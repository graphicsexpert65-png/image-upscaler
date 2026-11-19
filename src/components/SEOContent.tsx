import React from 'react';

const guideSteps = [
  'Select an image from your device or drag it into the upload area.',
  'Choose an enlargement level: 2x, 4x or 8x.',
  'Select the enhancement style that best suits your image.',
  'Start processing and wait for the result.',
  'Compare the original and enhanced image, then download the result.',
];

const formats = ['JPG', 'JPEG', 'PNG', 'WebP', 'BMP'];

const faqs = [
  {
    question: 'What is an AI image upscaler?',
    answer:
      'An AI image upscaler uses a trained machine-learning model to enlarge an image and estimate details that can make the larger result look clearer. Results vary depending on the original image and its quality.',
  },
  {
    question: 'How can I upscale an image online for free?',
    answer:
      'Choose an image, select 2x, 4x or 8x enlargement, choose an enhancement style and start processing. When processing finishes, compare the original and enhanced versions and download your result. No account is required to use the upscaler.',
  },
  {
    question: 'Are my uploaded images sent to a server?',
    answer:
      'Image upscaling runs locally in your browser. The selected image is not uploaded to a server for the upscaling process. Your browser may need an internet connection to load the application and its AI model files.',
  },
  {
    question: 'Which image formats can I use?',
    answer:
      'The tool supports JPG, JPEG, PNG, WebP and BMP images. Choose a supported image file from your device to get started.',
  },
  {
    question: 'What is the difference between 2x, 4x and 8x?',
    answer:
      '2x doubles the image width and height, 4x makes each dimension four times larger, and 8x makes each dimension eight times larger. Higher enlargement levels create much larger files and may require more device memory and processing time.',
  },
  {
    question: 'Can AI make every blurry image sharp?',
    answer:
      'No. AI can estimate and enhance visual details, but it cannot reliably recover information that is completely missing from an image. The final result depends on the source image, subject and level of blur.',
  },
];

export function SEOContent() {
  return (
    <section aria-labelledby="image-upscaler-guide" className="w-full bg-white border-t border-slate-200">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 xl:px-12 2xl:px-16 py-14 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-28">
            <span className="text-xs font-bold tracking-[0.18em] uppercase text-blue-800">Free online image enhancement guide</span>
            <h2 id="image-upscaler-guide" className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-slate-950">
              Free AI image upscaler to enlarge photos online.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Increase image resolution with this free online AI image upscaler. Powered by Real-ESRGAN super-resolution models, the tool enlarges photos, digital artwork and graphics by 2x, 4x or 8x. Image processing runs in your browser, so your selected image is not sent to a server for upscaling.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Use the image upscaler to prepare larger versions of personal photos, product pictures, illustrations and other graphics. The result depends on the quality of the original image, and very blurry images may still have limitations.
            </p>
            <div className="mt-7 flex flex-wrap gap-2" aria-label="Supported image formats">
              {formats.map((format) => (
                <span key={format} className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-bold tracking-wide text-slate-700">{format}</span>
              ))}
            </div>
            <nav aria-label="Image upscaling guides" className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-bold text-slate-950">Explore our image upscaling guides</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a className="font-semibold text-blue-900 underline underline-offset-4" href="/ai-image-upscaler/">AI image upscaler guide</a></li>
                <li><a className="font-semibold text-blue-900 underline underline-offset-4" href="/enlarge-image-2x/">How to enlarge an image 2x</a></li>
                <li><a className="font-semibold text-blue-900 underline underline-offset-4" href="/enlarge-image-4x/">How to enlarge an image 4x</a></li>
                <li><a className="font-semibold text-blue-900 underline underline-offset-4" href="/photo-resolution-enhancer/">Photo resolution enhancer guide</a></li>
              </ul>
            </nav>         </div>

          <div className="space-y-10">
            <article>
              <div className="flex items-center gap-3 mb-5">
                <span className="h-9 w-9 rounded-lg bg-blue-950 text-white flex items-center justify-center text-sm font-bold">01</span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-950">How to upscale an image online</h3>
              </div>
              <ol className="border-l border-slate-200 ml-4 space-y-5">
                {guideSteps.map((step, index) => (
                  <li key={step} className="relative pl-7 text-sm sm:text-base leading-7 text-slate-600">
                    <span className="absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-xs font-bold text-blue-950">{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </article>

            <article className="border-t border-slate-200 pt-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-9 w-9 rounded-lg bg-blue-950 text-white flex items-center justify-center text-sm font-bold">02</span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-950">What does AI image upscaling do?</h3>
              </div>
              <p className="text-sm sm:text-base leading-7 text-slate-600">
                AI image upscaling uses a trained neural network to estimate details when enlarging a picture. Real-ESRGAN is designed for image super-resolution and can improve the appearance of many low-resolution photos and graphics. The result depends on the source image; AI cannot always recover details that were never present.
              </p>
            </article>

            <article className="border-t border-slate-200 pt-8">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-9 w-9 rounded-lg bg-blue-950 text-white flex items-center justify-center text-sm font-bold">03</span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-950">Choose the right image upscale level</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  ['2×', 'Double width and height', 'Best for a lighter enlargement.'],
                  ['4×', 'Four times each dimension', 'A balanced choice for many images.'],
                  ['8×', 'Eight times each dimension', 'For larger output; needs more memory.'],
                ].map(([scale, title, detail]) => (
                  <div key={scale} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-2xl font-extrabold text-blue-950">{scale}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">Larger output images require more memory and processing time. If your device struggles with a large image, try a lower enlargement level.</p>
            </article>

            <article className="border-t border-slate-200 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="h-9 w-9 rounded-lg bg-blue-950 text-white flex items-center justify-center text-sm font-bold">04</span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-950">Supported image formats</h3>
              </div>
              <p className="text-sm sm:text-base leading-7 text-slate-600">Upload JPG, JPEG, PNG, WebP or BMP images. Transparent PNG artwork is supported, including alpha transparency. The tool works in a modern browser without requiring desktop image-editing software.</p>
            </article>

            <article className="border-t border-slate-200 pt-8">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-950">Tips for getting better image upscaling results</h3>
              <p className="mt-3 text-sm sm:text-base leading-7 text-slate-600">
                Start with the clearest, highest-resolution original file you have. Avoid repeatedly enlarging an already upscaled image, because each generation can make artifacts more noticeable. For a modest size increase, try 2x first; use 4x when you need a larger image, and choose 8x only when your device has enough memory and you need the extra dimensions.
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm sm:text-base leading-7 text-slate-600">
                <li>Use the original photo or graphic instead of a compressed screenshot when possible.</li>
                <li>Preview the result at full size to check faces, fine lines, text and edges.</li>
                <li>Keep the original file so you can compare results or try a different enlargement level.</li>
              </ul>
            </article>

            <article className="border-t border-slate-200 pt-8" aria-labelledby="image-upscaler-faq">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-9 w-9 rounded-lg bg-blue-950 text-white flex items-center justify-center text-sm font-bold">05</span>
                <h3 id="image-upscaler-faq" className="text-xl sm:text-2xl font-bold text-slate-950">Frequently asked questions about AI image upscaling</h3>
              </div>
              <div className="space-y-5">
                {faqs.map((faq) => (
                  <div key={faq.question} className="border-b border-slate-100 pb-5 last:border-b-0">
                    <h4 className="text-base font-semibold leading-7 text-slate-900">{faq.question}</h4>
                    <p className="mt-2 text-sm sm:text-base leading-7 text-slate-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
