import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type LayerType = 'ndvi' | 'water' | 'urban';
type ClimateDataType = 'emissions';

interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface GEERequest {
  type: LayerType;
  bounds: Bounds;
  startDate?: string;
  endDate?: string;
}

interface ClimateTraceRequest {
  country: string;
  sector?: string;
  year?: number;
}

interface SDGRequest {
  goal: number;
  country: string;
  indicator?: string;
}

export function useEarthIntelligence() {
  const [loading, setLoading] = useState(false);

  const fetchGEEData = async (request: GEERequest) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gee-proxy', {
        body: request
      });

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error fetching GEE data:', error);
      toast.error(`Failed to fetch ${request.type} data: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchClimateData = async (request: ClimateTraceRequest) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('climatetrace-proxy', {
        body: request
      });

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error fetching climate data:', error);
      toast.error(`Failed to fetch emissions data: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchSDGData = async (request: SDGRequest) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sdg-proxy', {
        body: request
      });

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error fetching SDG data:', error);
      toast.error(`Failed to fetch SDG data: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchSentinelTile = async (z: number, x: number, y: number, layer: string = 'true-color') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sentinel-proxy', {
        body: { z, x, y, layer }
      });

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error fetching Sentinel tile:', error);
      toast.error(`Failed to fetch satellite imagery: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchGEEData,
    fetchClimateData,
    fetchSDGData,
    fetchSentinelTile
  };
}
