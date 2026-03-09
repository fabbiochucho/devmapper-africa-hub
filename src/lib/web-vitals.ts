/**
 * Web Vitals monitoring - reports Core Web Vitals to analytics_events
 * Metrics tracked: LCP, FID, CLS, FCP, TTFB, INP
 */

import { supabase } from '@/integrations/supabase/client';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

// Thresholds based on Google's Web Vitals standards
const THRESHOLDS: Record<string, [number, number]> = {
  LCP: [2500, 4000],     // ms
  FID: [100, 300],       // ms
  CLS: [0.1, 0.25],      // score
  FCP: [1800, 3000],     // ms
  TTFB: [800, 1800],     // ms
  INP: [200, 500],       // ms
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (!threshold) return 'good';
  if (value <= threshold[0]) return 'good';
  if (value <= threshold[1]) return 'needs-improvement';
  return 'poor';
}

// Batch metrics to reduce API calls
let metricsQueue: WebVitalMetric[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

async function flushMetrics() {
  if (metricsQueue.length === 0) return;
  
  const metrics = [...metricsQueue];
  metricsQueue = [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const events = metrics.map(metric => ({
      event_type: 'web_vital',
      user_id: user?.id || null,
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      event_data: {
        metric_name: metric.name,
        metric_value: Math.round(metric.value * 100) / 100,
        metric_rating: metric.rating,
        metric_delta: Math.round(metric.delta * 100) / 100,
        metric_id: metric.id,
        navigation_type: metric.navigationType,
        connection_type: (navigator as any).connection?.effectiveType || 'unknown',
        device_memory: (navigator as any).deviceMemory || null,
        hardware_concurrency: navigator.hardwareConcurrency || null,
        timestamp: Date.now(),
      }
    }));

    await supabase.from('analytics_events').insert(events);
  } catch (error) {
    console.error('[WebVitals] Failed to report metrics:', error);
  }
}

function queueMetric(metric: WebVitalMetric) {
  metricsQueue.push(metric);
  
  if (flushTimeout) clearTimeout(flushTimeout);
  
  // Flush after 5 seconds or when queue reaches 6 metrics (all vitals reported)
  if (metricsQueue.length >= 6) {
    flushMetrics();
  } else {
    flushTimeout = setTimeout(flushMetrics, 5000);
  }
}

function onMetric(name: string, entry: PerformanceEntry, navigationType: string) {
  let value: number;
  
  switch (name) {
    case 'CLS':
      // CLS is accumulated from layout shift entries
      value = (entry as any).value || 0;
      break;
    case 'LCP':
      value = (entry as PerformanceEntry).startTime;
      break;
    case 'FID':
      value = (entry as PerformanceEventTiming).processingStart - entry.startTime;
      break;
    case 'INP':
      value = (entry as any).duration || 0;
      break;
    default:
      value = entry.startTime;
  }

  const metric: WebVitalMetric = {
    name,
    value,
    rating: getRating(name, value),
    delta: value,
    id: `${name}-${Date.now()}`,
    navigationType,
  };

  queueMetric(metric);
}

/**
 * Initialize Web Vitals monitoring using PerformanceObserver
 * This is a lightweight implementation that doesn't require the web-vitals library
 */
export function initWebVitals() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  const navigationType = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type || 'navigate';

  // LCP - Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) onMetric('LCP', lastEntry, navigationType);
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) { /* Observer not supported */ }

  // FID - First Input Delay
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0];
      if (firstEntry) {
        onMetric('FID', firstEntry, navigationType);
        fidObserver.disconnect();
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch (e) { /* Observer not supported */ }

  // CLS - Cumulative Layout Shift
  try {
    let clsValue = 0;
    let clsEntries: PerformanceEntry[] = [];
    let sessionValue = 0;
    let sessionEntries: PerformanceEntry[] = [];

    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only count layout shifts without recent user input
        if (!(entry as any).hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

          // If the entry occurred less than 1 second after the previous entry
          // and less than 5 seconds after the first entry in the session,
          // include it in the current session. Otherwise, start a new session.
          if (
            sessionValue &&
            firstSessionEntry &&
            lastSessionEntry &&
            entry.startTime - lastSessionEntry.startTime < 1000 &&
            entry.startTime - firstSessionEntry.startTime < 5000
          ) {
            sessionValue += (entry as any).value;
            sessionEntries.push(entry);
          } else {
            sessionValue = (entry as any).value;
            sessionEntries = [entry];
          }

          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            clsEntries = [...sessionEntries];
          }
        }
      }

      // Report CLS with accumulated value
      if (clsEntries.length > 0) {
        const syntheticEntry = { ...clsEntries[clsEntries.length - 1], value: clsValue } as any;
        onMetric('CLS', syntheticEntry, navigationType);
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (e) { /* Observer not supported */ }

  // FCP - First Contentful Paint
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
      if (fcpEntry) {
        onMetric('FCP', fcpEntry, navigationType);
        fcpObserver.disconnect();
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
  } catch (e) { /* Observer not supported */ }

  // TTFB - Time to First Byte
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const navEntry = navEntries[0] as PerformanceNavigationTiming;
      const ttfbEntry = { ...navEntry, startTime: navEntry.responseStart } as any;
      onMetric('TTFB', ttfbEntry, navigationType);
    }
  } catch (e) { /* Not available */ }

  // INP - Interaction to Next Paint (experimental)
  try {
    const inpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      // Report the worst interaction
      const worstEntry = entries.reduce((worst, entry) => {
        return (!worst || (entry as any).duration > (worst as any).duration) ? entry : worst;
      }, null as PerformanceEntry | null);
      if (worstEntry) onMetric('INP', worstEntry, navigationType);
    });
    inpObserver.observe({ type: 'event', buffered: true } as any);
  } catch (e) { /* Observer not supported */ }

  // Flush remaining metrics when page is unloaded
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushMetrics();
    }
  });
}

/**
 * Get current performance summary for display
 */
export function getPerformanceSummary(): Record<string, { value: number; rating: string }> | null {
  if (typeof window === 'undefined') return null;
  
  const summary: Record<string, { value: number; rating: string }> = {};
  
  // Get navigation timing
  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navEntry) {
    const ttfb = navEntry.responseStart;
    summary['TTFB'] = { value: Math.round(ttfb), rating: getRating('TTFB', ttfb) };
    
    const loadTime = navEntry.loadEventEnd - navEntry.fetchStart;
    summary['Load Time'] = { value: Math.round(loadTime), rating: loadTime < 3000 ? 'good' : loadTime < 5000 ? 'needs-improvement' : 'poor' };
  }
  
  // Get paint timing
  const paintEntries = performance.getEntriesByType('paint');
  const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');
  if (fcp) {
    summary['FCP'] = { value: Math.round(fcp.startTime), rating: getRating('FCP', fcp.startTime) };
  }
  
  return Object.keys(summary).length > 0 ? summary : null;
}
