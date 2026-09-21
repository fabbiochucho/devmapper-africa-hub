import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Database } from '@/integrations/supabase/types';

type ChangeMaker = Database['public']['Tables']['change_makers']['Row'];

// Kept lazy for consistency with other map-tab components, even though
// ChangeMakerMap itself no longer pulls in react-leaflet (see its comment --
// change_makers has no lat/lng columns to plot).
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
