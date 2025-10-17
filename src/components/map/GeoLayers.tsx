import { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Leaf, Droplets, Building, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import UpgradePrompt from '@/components/UpgradePrompt';

interface GeoLayersProps {
  map: maplibregl.Map | null;
}

type LayerType = 'ndvi' | 'water' | 'urban' | 'emissions';

interface LayerState {
  ndvi: boolean;
  water: boolean;
  urban: boolean;
  emissions: boolean;
}

export default function GeoLayers({ map }: GeoLayersProps) {
  const { canAccess, loading: featureLoading } = useFeatureAccess();
  const [layers, setLayers] = useState<LayerState>({
    ndvi: false,
    water: false,
    urban: false,
    emissions: false
  });
  const [loading, setLoading] = useState<Partial<Record<LayerType, boolean>>>({});

  const hasEarthIntel = canAccess('view_earth_intelligence');
  const hasAdvancedIntel = canAccess('advanced_earth_intel');

  const toggleLayer = async (layerType: LayerType) => {
    if (!map) {
      toast.error('Map not initialized');
      return;
    }

    const newState = !layers[layerType];
    setLayers(prev => ({ ...prev, [layerType]: newState }));

    if (newState) {
      // Load layer data
      await loadLayerData(layerType);
    } else {
      // Remove layer
      removeLayer(layerType);
    }
  };

  const loadLayerData = async (layerType: LayerType) => {
    if (!map) return;

    setLoading(prev => ({ ...prev, [layerType]: true }));

    try {
      const bounds = map.getBounds();
      const boundsData = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      };

      let endpoint = '';
      let requestData = {};

      switch (layerType) {
        case 'ndvi':
        case 'water':
        case 'urban':
          endpoint = 'gee-proxy';
          requestData = {
            type: layerType,
            bounds: boundsData,
            startDate: '2023-01-01',
            endDate: '2023-12-31'
          };
          break;
        case 'emissions':
          endpoint = 'climatetrace-proxy';
          requestData = {
            country: 'all',
            sector: 'all',
            year: 2022
          };
          break;
      }

      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: requestData
      });

      if (error) {
        console.error('[GeoLayers] Edge function error:', error);
        throw new Error(error.message || 'Edge Function returned an error');
      }

      if (!data || !data.data) {
        throw new Error('No data returned from Earth Intelligence service');
      }

      // Add layer to map
      addLayerToMap(layerType, data);
      toast.success(`${layerType.toUpperCase()} layer loaded`);
    } catch (error: any) {
      console.error(`Error loading ${layerType} layer:`, error);
      toast.error(`Failed to load ${layerType} layer: ${error.message}`);
      setLayers(prev => ({ ...prev, [layerType]: false }));
    } finally {
      setLoading(prev => ({ ...prev, [layerType]: false }));
    }
  };

  const addLayerToMap = (layerType: LayerType, data: any) => {
    if (!map) return;

    const sourceId = `${layerType}-source`;
    const layerId = `${layerType}-layer`;

    // Remove existing layer and source if present
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // Convert data to GeoJSON
    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: data.data?.map((point: any) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [point.lng, point.lat]
        },
        properties: {
          value: point.value
        }
      })) || []
    };

    map.addSource(sourceId, {
      type: 'geojson',
      data: geojsonData
    });

    // Add heatmap layer
    const layerConfig = getLayerConfig(layerType);
    map.addLayer({
      id: layerId,
      type: 'heatmap',
      source: sourceId,
      paint: {
        'heatmap-weight': ['get', 'value'] as any,
        'heatmap-intensity': 1,
        'heatmap-color': layerConfig.colorRamp as any,
        'heatmap-radius': 20,
        'heatmap-opacity': 0.7
      }
    });
  };

  const removeLayer = (layerType: LayerType) => {
    if (!map) return;

    const sourceId = `${layerType}-source`;
    const layerId = `${layerType}-layer`;

    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  };

  const getLayerConfig = (layerType: LayerType) => {
    const configs = {
      ndvi: {
        colorRamp: [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(255, 255, 200, 0)',
          0.2, 'rgba(200, 255, 200, 0.5)',
          0.4, 'rgba(100, 255, 100, 0.7)',
          0.6, 'rgba(0, 200, 0, 0.8)',
          1, 'rgba(0, 100, 0, 1)'
        ]
      },
      water: {
        colorRamp: [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(173, 216, 230, 0)',
          0.5, 'rgba(100, 149, 237, 0.6)',
          1, 'rgba(0, 0, 139, 1)'
        ]
      },
      urban: {
        colorRamp: [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(255, 255, 224, 0)',
          0.3, 'rgba(255, 200, 100, 0.5)',
          0.6, 'rgba(255, 100, 50, 0.7)',
          1, 'rgba(139, 0, 0, 1)'
        ]
      },
      emissions: {
        colorRamp: [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(255, 255, 0, 0)',
          0.3, 'rgba(255, 165, 0, 0.5)',
          0.6, 'rgba(255, 69, 0, 0.7)',
          1, 'rgba(178, 34, 34, 1)'
        ]
      }
    };
    return configs[layerType];
  };

  if (featureLoading) {
    return (
      <Card className="absolute top-4 right-4 z-10 p-4 bg-background/95 backdrop-blur">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-8 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!hasEarthIntel) {
    return (
      <Card className="absolute top-4 right-4 z-10 p-4 bg-background/95 backdrop-blur max-w-sm">
        <UpgradePrompt feature="Earth Intelligence Layers" requiredPlan="lite" inline />
      </Card>
    );
  }

  return (
    <Card className="absolute top-4 right-4 z-10 p-4 bg-background/95 backdrop-blur">
      <h3 className="font-semibold mb-4">Earth Intelligence Layers</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-600" />
            <Label htmlFor="ndvi" className="text-sm">NDVI (Vegetation)</Label>
          </div>
          <Switch
            id="ndvi"
            checked={layers.ndvi}
            onCheckedChange={() => toggleLayer('ndvi')}
            disabled={loading.ndvi}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-600" />
            <Label htmlFor="water" className="text-sm">Water Bodies</Label>
          </div>
          <Switch
            id="water"
            checked={layers.water}
            onCheckedChange={() => toggleLayer('water')}
            disabled={loading.water}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-orange-600" />
            <Label htmlFor="urban" className="text-sm">Urban Expansion</Label>
          </div>
          <Switch
            id="urban"
            checked={layers.urban}
            onCheckedChange={() => toggleLayer('urban')}
            disabled={loading.urban}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-600" />
            <Label htmlFor="emissions" className="text-sm">Emissions</Label>
          </div>
          <Switch
            id="emissions"
            checked={layers.emissions}
            onCheckedChange={() => toggleLayer('emissions')}
            disabled={loading.emissions}
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
        <p>Data sources:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Google Earth Engine</li>
          <li>Copernicus Sentinel Hub</li>
          <li>Climate TRACE</li>
        </ul>
      </div>
    </Card>
  );
}
