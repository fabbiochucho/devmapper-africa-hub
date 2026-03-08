import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '@/integrations/supabase/client';

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

    // Add cluster layer
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
            '#51bbd6',
            10,
            '#f1f075',
            30,
            '#f28cb1'
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
        'circle-color': '#11b4da',
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    });

    // Add click handlers
    map.current.on('click', 'markers-unclustered', (e) => {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0];
      const coordinates = (feature.geometry as any).coordinates.slice();
      
      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div class="p-2">
            <h3 class="font-bold">${feature.properties?.title || 'Project'}</h3>
            <p class="text-sm">${feature.properties?.description || ''}</p>
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
