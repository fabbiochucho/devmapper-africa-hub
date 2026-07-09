import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChangeMaker } from '@/data/mockChangeMakers';

// ChangeMakerMap pulls in react-leaflet + leaflet.markercluster (part of
// the shared vendor-maps chunk). Lazy-loaded so it only fetches on pages
// that actually render it.
const ChangeMakerMap = lazy(() => import('./ChangeMakerMap'));

interface LazyChangeMakerMapProps {
  changeMakers: ChangeMaker[];
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

export default function LazyChangeMakerMap({ changeMakers }: LazyChangeMakerMapProps) {
  return (
    <Suspense fallback={<MapLoadingFallback />}>
      <ChangeMakerMap changeMakers={changeMakers} />
    </Suspense>
  );
}
