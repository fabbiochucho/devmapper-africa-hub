
import './lib/env';
import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config';
import { registerServiceWorker } from './lib/sw-register';
import { initWebVitals } from './lib/web-vitals';
import { prefetchCommonRoutes } from './lib/route-prefetch';
import { initSentry } from './lib/sentry';

// Clickjacking guard. Lovable hosting can't send X-Frame-Options, so on the live domain
// refuse to render inside another site's frame. Preview domains (the Lovable editor) are
// left alone.
const framedOnLiveSite = window.top !== window.self && /(^|\.)devmapper\.africa$/.test(location.hostname);

createRoot(document.getElementById("root")!).render(
  framedOnLiveSite ? (
    <p style={{ fontFamily: 'sans-serif', padding: 24 }}>
      For your security, Dev Mapper can't be shown inside another website.{' '}
      <a href={location.href} target="_top" rel="noopener">Open devmapper.africa</a>
    </p>
  ) : (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
);

// Register service worker for PWA + push notifications
registerServiceWorker();

// Initialize Web Vitals monitoring after page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Start Web Vitals monitoring
    initWebVitals();

    // Error monitoring (no-op until a Sentry DSN is set)
    void initSentry();
    
    // Prefetch common routes when idle
    prefetchCommonRoutes();
  }, { once: true });
}
