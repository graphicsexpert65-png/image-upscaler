import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import { SeoLandingPage } from './components/SeoLandingPage';
import './index.css';

const seoPaths = ['/ai-image-upscaler', '/enlarge-image-2x', '/enlarge-image-4x', '/photo-resolution-enhancer'];
const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';

createRoot(document.getElementById('root')!).render(
  <>
    {seoPaths.includes(currentPath) ? <SeoLandingPage /> : <App />}
    <Analytics />
  </>
);
