import React, { useEffect } from 'react';
import { ArrowRight, Palette, Image as ImageIcon, ShieldCheck, Sparkles } from 'lucide-react';
import { Footer } from './Footer';

export function AboutCreatorPage() {
  useEffect(() => {
    const title = 'About Graphics Expert | Creator of the Free AI Image Upscaler';
    const description = 'Meet Graphics Expert, a graphic designer who created this free browser-based AI image upscaler to help designers, photographers and creators improve low-resolution images.';
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = 'https://image-upscaler-74z.pages.dev/about-graphics-expert/';
    let schema = document.getElementById('creator-page-schema') as HTMLScriptElement | null;
    if (!schema) {
      schema = document.createElement('script');
      schema.id = 'creator-page-schema';
      schema.type = 'application/ld+json';
      document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Graphics Expert',
      url: canonical.href,
      description,
      mainEntity: {
        '@type': 'Person',
        name: 'Graphics Expert',
        jobTitle: 'Graphic Designer',
        description: 'Graphic designer and creator of this browser-based AI image upscaler.'
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <a href="/" className="font-bold text-blue-950">AI Image Upscaler</a>
          <a href="/" className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white">Open free tool <ArrowRight className="ml-1 inline" size={16} /></a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-bold tracking-[0.18em] text-blue-800">ABOUT THE CREATOR</p>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">Meet Graphics Expert</h1>
          <p className="mt-5 text-xl font-semibold text-blue-950">A Graphic Designer Who Believes Better Images Should Be Within Everyone’s Reach.</p>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Hello! I’m Graphics Expert, a graphic designer who works with visual content and understands how important image quality is in creative work. A low-resolution or pixelated image can make an otherwise good design look less professional.
          </p>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            That practical challenge inspired me to create this free online AI Image Upscaler: a simple tool that helps people enlarge and enhance images for their creative projects, without needing complicated desktop software.
          </p>
        </div>

        <section className="mt-12 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-900"><Palette size={22} /></div>
            <h2 className="mt-4 text-xl font-bold">Why I created this tool</h2>
            <p className="mt-3 leading-7 text-slate-600">As a graphic designer, I know that finding a suitable high-resolution image is not always easy. Sometimes a useful photo, product image or design asset is simply too small. I wanted to make image enlargement more accessible with a straightforward tool that people can use online.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-900"><ImageIcon size={22} /></div>
            <h2 className="mt-4 text-xl font-bold">Who it is made for</h2>
            <p className="mt-3 leading-7 text-slate-600">This tool is intended for graphic designers, photographers, social media creators, students, small businesses and anyone who needs a larger version of an image for a digital or creative project.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-900"><Sparkles size={22} /></div>
            <h2 className="mt-4 text-xl font-bold">What the tool can do</h2>
            <p className="mt-3 leading-7 text-slate-600">Choose 2×, 4× or 8× enlargement to increase image dimensions with AI-assisted super-resolution. It supports common image formats including JPG, JPEG, PNG, WebP and BMP. Results depend on the original image and your device.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-900"><ShieldCheck size={22} /></div>
            <h2 className="mt-4 text-xl font-bold">A privacy-conscious approach</h2>
            <p className="mt-3 leading-7 text-slate-600">Image enhancement is processed in your browser, so the selected image is not sent to a server for the upscaling process. Your browser still needs an internet connection to load the website and model files.</p>
          </article>
        </section>

        <section className="mt-12 rounded-3xl bg-[#101f3d] px-6 py-9 text-white sm:px-10">
          <p className="text-xs font-bold tracking-[0.18em] text-blue-200">MY PURPOSE</p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Making image enhancement easier and more accessible.</h2>
          <p className="mt-4 max-w-3xl leading-7 text-blue-100/80">My goal is to keep improving this tool and make it useful for people who work with images every day, as well as anyone who simply wants to improve a picture. I hope it saves you time and helps bring your creative ideas to life.</p>
          <a href="/" className="mt-6 inline-flex items-center rounded-xl bg-white px-5 py-3 font-semibold text-blue-950">Try the free image upscaler <ArrowRight className="ml-2" size={18} /></a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
