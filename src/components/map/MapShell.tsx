import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '@/integrations/supabase/client';

// MapLibre's paint properties need real color values, not Tailwind classes -
// read the design tokens' actual HSL from the live theme so markers stay
// correct in dark mode instead of carrying their own hardcoded palette.
function cssToken(name: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? `hsl(${value})` : '#000000';
}

// Popup content is built as an HTML string (MapLibre's Popup API has no JSX
// escape hatch) from report title/description fields a user controls -
// escape before interpolating so a crafted title can't inject markup.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface MapShellProps {
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

export default function MapShell({
  center = [20, 0], // Africa center
  zoom = 3,
  onLoad,
  className = 'w-full h-full',
  enableClusters = true,
  markers = []
}: MapShellProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center,
      zoom
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
      if (onLoad && map.current) {
        onLoad(map.current);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when they change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers layer
    if (map.current.getLayer('markers-cluster')) {
      map.current.removeLayer('markers-cluster');
    }
    if (map.current.getLayer('markers-count')) {
      map.current.removeLayer('markers-count');
    }
    if (map.current.getLayer('markers-unclustered')) {
      map.current.removeLayer('markers-unclustered');
    }
    if (map.current.getSource('markers')) {
      map.current.removeSource('markers');
    }

    if (markers.length === 0) return;

    // Add markers as GeoJSON source
    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: markers.map(marker => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: marker.coordinates
        },
        properties: {
          id: marker.id,
          ...marker.properties
        }
      }))
    };

    map.current.addSource('markers', {
      type: 'geojson',
      data: geojsonData,
      cluster: enableClusters,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Add cluster layer - color steps encode attention level (more projects
    // clustered together warrants a warmer, more attention-grabbing color),
    // using the same semantic tokens as the rest of the app rather than an
    // arbitrary hardcoded palette.
    if (enableClusters) {
      map.current.addLayer({
        id: 'markers-cluster',
        type: 'circle',
        source: 'markers',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            cssToken('--info'),
            10,
            cssToken('--primary'),
            30,
            cssToken('--warning')
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            30,
            30,
            40
          ]
        }
      });

      // Cluster count labels - only add if style has glyphs configured
      if (map.current.getStyle()?.glyphs) {
        map.current.addLayer({
          id: 'markers-count',
          type: 'symbol',
          source: 'markers',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Bold'],
            'text-size': 12
          }
        });
      }
    }

    // Add unclustered points
    map.current.addLayer({
      id: 'markers-unclustered',
      type: 'circle',
      source: 'markers',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': cssToken('--primary'),
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': cssToken('--background')
      }
    });

    // Add click handlers
    map.current.on('click', 'markers-unclustered', (e) => {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0];
      const coordinates = (feature.geometry as any).coordinates.slice();
      
      const title = escapeHtml(feature.properties?.title || 'Project');
      const description = escapeHtml((feature.properties?.description || '').substring(0, 100));
      const status = escapeHtml(feature.properties?.status || 'N/A');
      const sdg = escapeHtml(String(feature.properties?.sdg ?? ''));
      const projectId = encodeURIComponent(feature.properties?.id || '');

      new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
        .setLngLat(coordinates)
        .setHTML(`
          <div class="p-3 space-y-2 min-w-[200px]">
            <h3 class="font-semibold text-sm leading-snug text-foreground">${title}</h3>
            ${description ? `<p class="text-xs text-muted-foreground line-clamp-2">${description}</p>` : ''}
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium text-foreground">${status}</span>
              ${sdg ? `<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium text-foreground">SDG ${sdg}</span>` : ''}
            </div>
            <a href="/project/${projectId}" class="inline-flex items-center justify-center rounded-md text-xs font-medium h-7 px-3 w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">View details</a>
          </div>
        `)
        .addTo(map.current!);
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'markers-unclustered', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'markers-unclustered', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

  }, [markers, mapLoaded, enableClusters]);

  return (
    <div className={className}>
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
