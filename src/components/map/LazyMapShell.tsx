import React, { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type maplibregl from 'maplibre-gl';

// Lazy load the MapShell component
const MapShell = lazy(() => import('./MapShell'));

interface LazyMapShellProps {
  center?: [number, number];
  zoom?: number;
  onLoad?: (map: maplibregl.Map) => void;
  className?: string;
  enableClusters?: boolean;
  markers?: Array<{
    id: string;
    coordinates: [number, number];
    properties: Record<string, any>;
  }>;
}

const MapLoadingFallback = ({ className }: { className?: string }) => (
  <div className={`relative ${className || 'h-[400px]'}`}>
    <Skeleton className="absolute inset-0 rounded-lg" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading map...</span>
      </div>
    </div>
  </div>
);

export const LazyMapShell: React.FC<LazyMapShellProps> = (props) => {
  return (
    <Suspense fallback={<MapLoadingFallback className={props.className} />}>
      <MapShell {...props} />
    </Suspense>
  );
};

export default LazyMapShell;
