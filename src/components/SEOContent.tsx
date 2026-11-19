import React from 'react';

export function SEOContent() {
  return (
    <section
      aria-labelledby="image-upscaler-guide"
      className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 text-zinc-300 space-y-8"
    >
      <div className="space-y-3">
        <h2 id="image-upscaler-guide" className="text-2xl font-bold text-white">
          Free AI Image Upscaler – Enlarge Images Without Losing Clarity
        </h2>
        <p className="text-sm leading-7">
          Increase image resolution with this free online AI image upscaler.
          Powered by Real-ESRGAN super-resolution models, the tool can enlarge
          photos, digital artwork and graphics by 2x, 4x or 8x. Processing runs
          in your browser, so your selected image is not sent to a server for
          upscaling.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-white">How to Upscale an Image Online</h2>
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-7">
          <li>Select an image from your device or drag it into the upload area.</li>
          <li>Choose an enlargement level: 2x, 4x or 8x.</li>
          <li>Select the enhancement style that best suits your image.</li>
          <li>Start processing and wait for the result.</li>
          <li>Compare the original and enhanced image, then download the result.</li>
        </ol>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-white">What Does AI Image Upscaling Do?</h2>
        <p className="text-sm leading-7">
          AI image upscaling uses a trained neural network to estimate details
          when enlarging a picture. Real-ESRGAN is designed for image
          super-resolution and can improve the appearance of many low-resolution
          photos and graphics. The result depends on the source image; AI cannot
          always recover details that were never present.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Choose 2x, 4x or 8x Upscaling</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm leading-7">
          <li><strong>2x:</strong> doubles the image width and height.</li>
          <li><strong>4x:</strong> makes both dimensions four times larger.</li>
          <li><strong>8x:</strong> makes both dimensions eight times larger, subject to device and output-size limits.</li>
        </ul>
        <p className="text-sm leading-7">
          Larger output images require more memory and processing time. If your
          device struggles with a large image, try a lower enlargement level.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Supported Image Formats</h2>
        <p className="text-sm leading-7">
          Upload JPG, JPEG, PNG, WebP or BMP images. Transparent PNG artwork is
          supported, including alpha transparency. The tool works in a modern
          browser without requiring desktop image-editing software.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Frequently Asked Questions</h2>

        <div>
          <h3 className="font-medium text-white">Is this AI image upscaler free?</h3>
          <p className="text-sm leading-7">
            Yes. You can use the online upscaler without paying to process and
            download enhanced images.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-white">Are my images uploaded to a server?</h3>
          <p className="text-sm leading-7">
            Image upscaling is performed in your browser. Your image is not
            uploaded to a server for the enhancement process.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-white">Which image formats can I use?</h3>
          <p className="text-sm leading-7">
            The uploader accepts JPG, JPEG, PNG, WebP and BMP files.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-white">Can I enlarge a transparent PNG?</h3>
          <p className="text-sm leading-7">
            Yes. PNG images with alpha transparency are supported.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-white">What is the difference between 2x, 4x and 8x?</h3>
          <p className="text-sm leading-7">
            These settings multiply both the width and height of the original
            image by two, four or eight. Available output size can depend on
            your device and the image dimensions.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-white">Will AI fix every blurry photo?</h3>
          <p className="text-sm leading-7">
            No. AI enhancement may improve some blurry or low-resolution
            pictures, but results vary with the original image and cannot be
            guaranteed for every photo.
          </p>
        </div>
      </div>
    </section>
  );
}
