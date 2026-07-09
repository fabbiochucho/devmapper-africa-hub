import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// EnhancedProjectMap pulls in maplibre-gl + react-leaflet (the ~1.1MB
// vendor-maps chunk). It was previously statically imported from
// src/pages/Index.tsx (via MapSection) - App.tsx never wraps the "/" route
// in Suspense, so every visitor's initial landing-page load pulled in the
// entire map stack before it even rendered. Lazy-loading here means
// vendor-maps only fetches once this component actually mounts.
const EnhancedProjectMap = lazy(() => import('./EnhancedProjectMap'));

interface LazyEnhancedProjectMapProps {
  showGeoLayers?: boolean;
}

function MapLoadingFallback() {
  return (
    <div className="relative w-full h-[500px]">
      <Skeleton className="absolute inset-0 rounded-lg" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading map...</span>
        </div>
      </div>
    </div>
  );
}

export default function LazyEnhancedProjectMap(props: LazyEnhancedProjectMapProps) {
  return (
    <Suspense fallback={<MapLoadingFallback />}>
      <EnhancedProjectMap {...props} />
    </Suspense>
  );
}
