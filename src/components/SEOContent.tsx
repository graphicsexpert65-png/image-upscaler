
import React from 'react';

export function SEOContent() {
  return (
    <section className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 text-zinc-300 space-y-10">
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-white">
          Free AI Image Upscaler Online – Enhance Images 2x &amp; 4x
        </h2>
        <p className="text-sm leading-7">
          Improve image resolution online with our free AI image
          upscaler powered by Real-ESRGAN technology. Enlarge
          photos, graphics, and transparent PNG images by 2x or
          4x directly in your browser, without installing software.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-white">
          How to Upscale an Image Online
        </h2>
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-7">
          <li>Upload a JPG, PNG, WebP, or BMP image.</li>
          <li>Choose 2x or 4x image upscaling.</li>
          <li>Start the AI image enhancement process.</li>
          <li>Compare the original and enhanced images.</li>
          <li>Download your upscaled image.</li>
        </ol>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-white">
          Why Use Our AI Image Upscaler?
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-sm leading-7">
          <li>Free online image upscaling.</li>
          <li>AI-powered 2x and 4x resolution enhancement.</li>
          <li>Supports transparent PNG images.</li>
          <li>Processes images locally in your browser.</li>
          <li>No software installation required.</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-white">
          2x vs 4x Image Upscaling
        </h2>
        <p className="text-sm leading-7">
          Choose 2x upscaling to double the width and height
          of your image. Choose 4x to increase both dimensions
          fourfold. Larger images may take longer to process
          depending on your device.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          Frequently Asked Questions
        </h2>

        <div>
          <h3 className="font-medium text-white">
            Is this AI image upscaler free?
          </h3>
          <p className="text-sm leading-7">
            Yes, you can use this image upscaling tool for free.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-white">
            Can I upscale PNG images with transparency?
          </h3>
          <p className="text-sm leading-7">
            Yes, the tool supports transparent PNG images.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-white">
            Are my images uploaded to a server?
          </h3>
          <p className="text-sm leading-7">
            Image enhancement runs locally in your browser,
            so your images are not uploaded for processing.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-white">
            Does 4x upscaling improve every image?
          </h3>
          <p className="text-sm leading-7">
            Results depend on the original image quality.
            AI enhancement cannot guarantee perfect details
            in every photo or graphic.
          </p>
        </div>
      </div>
    </section>
  );
}
