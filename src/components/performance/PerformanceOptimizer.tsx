import { useEffect, useState, memo, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Clock, Server, FileCode, HardDriveDownload } from 'lucide-react';

// Lazy load components for better performance
const LazyAnalytics = lazy(() => import('@/components/analytics/AdvancedAnalytics').then(module => ({ default: module.AdvancedAnalytics })));

// Every figure comes from the browser's Navigation Timing entry for this page load.
// (This panel previously showed Math.random() "DB query time" and "cache hit rate", and an
// "Optimize" button that waited 5s and then shrank the displayed numbers.)
interface PerformanceMetrics {
  loadTime: number;      // fetchStart -> loadEventEnd
  serverResponse: number; // requestStart -> responseStart (time to first byte)
  domReady: number;      // fetchStart -> domContentLoadedEventEnd
  transferKb: number;    // bytes over the network for the document (0 when served from cache)
  score: number;
}

function scoreFor(loadTime: number, serverResponse: number) {
  let score = 100;
  if (loadTime > 3000) score -= 40;
  else if (loadTime > 2000) score -= 25;
  else if (loadTime > 1000) score -= 10;
  if (serverResponse > 600) score -= 25;
  else if (serverResponse > 200) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function metricsFrom(nav: PerformanceNavigationTiming): PerformanceMetrics | null {
  if (!nav.loadEventEnd) return null; // page hasn't finished loading yet
  const loadTime = nav.loadEventEnd - nav.fetchStart;
  const serverResponse = nav.responseStart - nav.requestStart;
  return {
    loadTime,
    serverResponse,
    domReady: nav.domContentLoadedEventEnd - nav.fetchStart,
    transferKb: (nav.transferSize || 0) / 1024,
    score: scoreFor(loadTime, serverResponse),
  };
}

const scoreColor = (score: number) => (score >= 90 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600');
const scoreBadge = (score: number) =>
  score >= 90 ? { variant: 'default' as const, text: 'Excellent' }
  : score >= 70 ? { variant: 'secondary' as const, text: 'Good' }
  : { variant: 'destructive' as const, text: 'Needs Work' };

export const PerformanceOptimizer = memo(() => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const read = () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const m = nav && metricsFrom(nav);
      if (m) setMetrics(m);
      return !!m;
    };
    if (read()) return;
    // Still loading: read once the load event has finished.
    const onLoad = () => setTimeout(read, 0);
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const badge = scoreBadge(metrics.score);
  const tiles = [
    { icon: <Clock className="w-4 h-4 text-blue-500" />, label: 'Load Time', value: `${(metrics.loadTime / 1000).toFixed(2)}s`, bar: 100 - metrics.loadTime / 50 },
    { icon: <Server className="w-4 h-4 text-purple-500" />, label: 'Server Response', value: `${metrics.serverResponse.toFixed(0)}ms`, bar: 100 - metrics.serverResponse / 10 },
    { icon: <FileCode className="w-4 h-4 text-green-500" />, label: 'DOM Ready', value: `${(metrics.domReady / 1000).toFixed(2)}s`, bar: 100 - metrics.domReady / 40 },
    { icon: <HardDriveDownload className="w-4 h-4 text-orange-500" />, label: 'Page Transfer', value: metrics.transferKb ? `${metrics.transferKb.toFixed(1)} KB` : 'cached', bar: 100 - metrics.transferKb / 20 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Performance Dashboard
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Measured from this page load in your browser
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={badge.variant}>{badge.text}</Badge>
            <div className={`text-2xl font-bold ${scoreColor(metrics.score)}`}>
              {metrics.score.toFixed(0)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiles.map((tile) => (
              <div key={tile.label} className="space-y-2">
                <div className="flex items-center gap-2">
                  {tile.icon}
                  <span className="text-sm font-medium">{tile.label}</span>
                </div>
                <div className="text-2xl font-bold">{tile.value}</div>
                <Progress value={Math.max(0, Math.min(100, tile.bar))} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lazy loaded analytics for better performance */}
      <Suspense fallback={
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      }>
        <LazyAnalytics />
      </Suspense>
    </div>
  );
});

PerformanceOptimizer.displayName = 'PerformanceOptimizer';
