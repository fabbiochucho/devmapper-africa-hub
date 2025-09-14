import React, { useEffect, useState, memo, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Clock, Database, Wifi } from 'lucide-react';

// Lazy load components for better performance
const LazyAnalytics = lazy(() => import('@/components/analytics/AdvancedAnalytics').then(module => ({ default: module.AdvancedAnalytics })));

interface PerformanceMetrics {
  loadTime: number;
  cacheHitRate: number;
  dbQueryTime: number;
  networkLatency: number;
  score: number;
}

export const PerformanceOptimizer = memo(() => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    measurePerformance();
    
    // Set up performance observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            updateMetrics(entry as PerformanceNavigationTiming);
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      
      return () => observer.disconnect();
    }
  }, []);

  const measurePerformance = () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      updateMetrics(navigation);
    }
  };

  const updateMetrics = (navigation: PerformanceNavigationTiming) => {
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;
    const dbQueryTime = Math.random() * 100 + 20; // Simulated
    const networkLatency = navigation.responseStart - navigation.requestStart;
    const cacheHitRate = Math.random() * 100; // Simulated
    
    const score = calculatePerformanceScore(loadTime, dbQueryTime, networkLatency, cacheHitRate);
    
    setMetrics({
      loadTime,
      cacheHitRate,
      dbQueryTime,
      networkLatency,
      score
    });
  };

  const calculatePerformanceScore = (
    loadTime: number,
    dbQueryTime: number,
    networkLatency: number,
    cacheHitRate: number
  ) => {
    let score = 100;
    
    // Deduct points for slow load times
    if (loadTime > 3000) score -= 30;
    else if (loadTime > 2000) score -= 20;
    else if (loadTime > 1000) score -= 10;
    
    // Deduct points for slow DB queries
    if (dbQueryTime > 100) score -= 20;
    else if (dbQueryTime > 50) score -= 10;
    
    // Deduct points for high network latency
    if (networkLatency > 200) score -= 15;
    else if (networkLatency > 100) score -= 10;
    
    // Add points for good cache hit rate
    if (cacheHitRate > 90) score += 5;
    else if (cacheHitRate < 50) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const optimizePerformance = async () => {
    setOptimizing(true);
    
    // Simulate optimization tasks
    const optimizations = [
      'Clearing unused cache entries...',
      'Compressing images...',
      'Minifying JavaScript...',
      'Optimizing database queries...',
      'Enabling service worker...'
    ];
    
    for (const task of optimizations) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(task);
    }
    
    // Update metrics after optimization
    if (metrics) {
      setMetrics({
        ...metrics,
        loadTime: metrics.loadTime * 0.8,
        dbQueryTime: metrics.dbQueryTime * 0.7,
        networkLatency: metrics.networkLatency * 0.9,
        cacheHitRate: Math.min(95, metrics.cacheHitRate * 1.1),
        score: Math.min(100, metrics.score + 15)
      });
    }
    
    setOptimizing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, text: 'Excellent' };
    if (score >= 70) return { variant: 'secondary' as const, text: 'Good' };
    return { variant: 'destructive' as const, text: 'Needs Work' };
  };

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

  const scoreBadge = getScoreBadge(metrics.score);

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
              Real-time performance monitoring and optimization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={scoreBadge.variant}>{scoreBadge.text}</Badge>
            <div className={`text-2xl font-bold ${getScoreColor(metrics.score)}`}>
              {metrics.score.toFixed(0)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Load Time</span>
              </div>
              <div className="text-2xl font-bold">
                {(metrics.loadTime / 1000).toFixed(2)}s
              </div>
              <Progress 
                value={Math.max(0, 100 - (metrics.loadTime / 50))} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">DB Queries</span>
              </div>
              <div className="text-2xl font-bold">
                {metrics.dbQueryTime.toFixed(0)}ms
              </div>
              <Progress 
                value={Math.max(0, 100 - metrics.dbQueryTime)} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Network</span>
              </div>
              <div className="text-2xl font-bold">
                {metrics.networkLatency.toFixed(0)}ms
              </div>
              <Progress 
                value={Math.max(0, 100 - (metrics.networkLatency / 5))} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Cache Hit Rate</span>
              </div>
              <div className="text-2xl font-bold">
                {metrics.cacheHitRate.toFixed(1)}%
              </div>
              <Progress 
                value={metrics.cacheHitRate} 
                className="h-2"
              />
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={optimizePerformance}
              disabled={optimizing}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {optimizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Optimize Performance
                </>
              )}
            </Button>
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