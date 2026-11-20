import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-5 py-5 flex items-center justify-between gap-4">
          <a href="/" className="text-sm font-semibold text-blue-900 hover:text-blue-700 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Image Upscaler
          </a>
          <span className="text-sm font-bold text-slate-900">Graphics Expert</span>
        </div>
      </header>
      <article className="max-w-4xl mx-auto px-5 py-10 sm:py-14">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></div>
          <p className="text-sm font-semibold text-blue-900">Your privacy matters</p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: November 21, 2026</p>
        <p className="mt-6 leading-7 text-slate-700">This Privacy Policy explains how the Image Upscaler website, created by Graphics Expert, handles information when you visit and use our free browser-based image enhancement tool.</p>

        <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-lg font-bold text-emerald-950">Your images are processed in your browser</h2>
          <p className="mt-2 leading-7 text-emerald-950/85">When you select an image for upscaling, the image is read and processed locally by your browser using your device's resources. The selected image is not sent to or stored on our server for the upscaling process. We do not keep a copy of your uploaded photos.</p>
          <p className="mt-2 leading-7 text-emerald-950/85">Your image and the generated result may remain temporarily available in the current browser page while you use the tool. They are not intended to be saved by us. Closing or refreshing the page, clearing browser data, or ending the browser session may clear this temporary page data. Please download your result before leaving the page.</p>
          <p className="mt-2 text-sm leading-6 text-emerald-950/75">The website and AI model files still need to load over the internet. This does not mean your selected photo is uploaded for processing.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-bold text-slate-950">1. Information handled by the website</h2>
          <p className="leading-7">We do not ask you to create an account to use the image upscaler. We do not receive or store the image you select for the purpose of processing it. Like most websites, the hosting platform and service providers may process basic technical information needed to deliver, secure, and operate the website, such as browser/device details, IP address, and request information.</p>
        </section>

        <section className="mt-7 space-y-3">
          <h2 className="text-xl font-bold text-slate-950">2. Advertising and third-party services</h2>
          <p className="leading-7">This website may display advertisements from Google AdSense, Adsterra, or other third-party advertising partners. Google and its partner vendors may use cookies or similar technologies to serve ads, measure ad performance, prevent fraud, and, where enabled, show personalized ads based on a user's previous visits to this or other websites. Other advertising partners, including Adsterra, may also use cookies or similar technologies in connection with the ads they serve. These providers may collect or receive information such as your browser, device, IP address, or interaction with advertisements, subject to their own privacy policies and settings. Graphics Expert does not control the data practices of these third parties.</p>
          <p className="leading-7">You can manage personalized advertising from Google through <a className="text-blue-700 underline" href="https://adssettings.google.com/" target="_blank" rel="noreferrer">Google Ads Settings</a>. You can also manage or delete cookies through your browser settings. Your available choices may vary by provider, device, and location.</p>
          <ul className="list-disc pl-6 space-y-2 leading-7">
            <li><a className="text-blue-700 underline" href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">Google advertising and cookie information</a></li>
            <li><a className="text-blue-700 underline" href="https://support.google.com/adsense/answer/1348695" target="_blank" rel="noreferrer">Google AdSense Privacy Policy requirements</a></li>
            <li><a className="text-blue-700 underline" href="https://adsterra.com/privacy-policy/" target="_blank" rel="noreferrer">Adsterra Privacy Policy</a></li>
          </ul>
        </section>

        <section className="mt-7 space-y-3">
          <h2 className="text-xl font-bold text-slate-950">3. Analytics</h2>
          <p className="leading-7">We use website analytics services, including Cloudflare Web Analytics and Vercel Analytics, to understand general website usage and help maintain the service. These providers may process technical and usage information in accordance with their own policies.</p>
          <ul className="list-disc pl-6 space-y-2 leading-7">
            <li><a className="text-blue-700 underline" href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer">Cloudflare Privacy Policy</a></li>
            <li><a className="text-blue-700 underline" href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">Vercel Privacy Policy</a></li>
          </ul>
        </section>

        <section className="mt-7 space-y-3">
          <h2 className="text-xl font-bold text-slate-950">4. Cookies and your choices</h2>
          <p className="leading-7">Graphics Expert does not use an account or login system on this tool. Advertising and analytics partners may use cookies or similar technologies as described in this policy. You can manage or delete cookies through your browser settings. To control Google's personalized advertising, visit <a className="text-blue-700 underline" href="https://adssettings.google.com/" target="_blank" rel="noreferrer">Google Ads Settings</a>. You may also review the privacy choices offered by other advertising providers. Blocking cookies may affect some advertising or website features.</p>
        </section>

        <section className="mt-7 space-y-3">
          <h2 className="text-xl font-bold text-slate-950">5. Children's privacy</h2>
          <p className="leading-7">This website is a general-purpose image utility and is not designed to knowingly collect personal information from children. If you believe a child has provided personal information to us, please contact the website operator so the matter can be reviewed.</p>
        </section>

        <section className="mt-7 space-y-3">
          <h2 className="text-xl font-bold text-slate-950">6. Changes to this policy</h2>
          <p className="leading-7">We may update this Privacy Policy when the website, its features, or the services used on it change. The latest version and its update date will be published on this page.</p>
        </section>

        <section className="mt-7 space-y-3">
          <h2 className="text-xl font-bold text-slate-950">7. Contact</h2>
          <p className="leading-7">This website is created and maintained by Graphics Expert. If you have a privacy question, you can contact Graphics Expert at <a className="text-blue-700 underline" href="mailto:graphicsexpert65@gmail.com">graphicsexpert65@gmail.com</a>.</p>
        </section>
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap gap-4 text-sm">
          <a href="/" className="font-semibold text-blue-800 hover:underline">Image Upscaler Home</a>
          <a href="/about-graphics-expert/" className="font-semibold text-blue-800 hover:underline">About Graphics Expert</a>
        </div>
      </article>
    </main>
  );
}
