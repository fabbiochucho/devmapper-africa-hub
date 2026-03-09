
import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config';
import { registerServiceWorker } from './lib/sw-register';
import { initWebVitals } from './lib/web-vitals';
import { prefetchCommonRoutes } from './lib/route-prefetch';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA + push notifications
registerServiceWorker();

// Initialize Web Vitals monitoring after page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Start Web Vitals monitoring
    initWebVitals();
    
    // Prefetch common routes when idle
    prefetchCommonRoutes();
  }, { once: true });
}
