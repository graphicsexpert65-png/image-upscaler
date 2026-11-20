import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import { SeoLandingPage } from './components/SeoLandingPage';
import { AboutCreatorPage } from './components/AboutCreatorPage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import './index.css';

const seoPaths = ['/ai-image-upscaler', '/enlarge-image-2x', '/enlarge-image-4x', '/photo-resolution-enhancer'];
const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';

function HomeCanonical() {
  useEffect(() => {
    const canonicalUrl = 'https://image-upscaler-74z.pages.dev/';
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, []);
  return null;
}

createRoot(document.getElementById('root')!).render(
  <>
    {currentPath === '/' && <HomeCanonical />}
    {currentPath === '/privacy-policy' ? <PrivacyPolicyPage /> : currentPath === '/about-graphics-expert' ? <AboutCreatorPage /> : seoPaths.includes(currentPath) ? <SeoLandingPage /> : <App />}
    <Analytics />
  </>
);
