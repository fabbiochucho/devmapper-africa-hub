import { useState, useEffect } from 'react';
import MapShell from './MapShell';
import GeoLayers from './GeoLayers';
import { supabase } from '@/integrations/supabase/client';
import maplibregl from 'maplibre-gl';

interface Project {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  sdg_goal: number;
  project_status: string;
}

export default function EnhancedProjectMap() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('id, title, description, lat, lng, sdg_goal, project_status')
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (error) throw error;

      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const markers = projects.map(project => ({
    id: project.id,
    coordinates: [project.lng, project.lat] as [number, number],
    properties: {
      title: project.title,
      description: project.description,
      sdg: project.sdg_goal,
      status: project.project_status
    }
  }));

  return (
    <div className="relative w-full h-[600px]">
      <MapShell
        center={[20, 0]}
        zoom={3}
        onLoad={(mapInstance) => setMap(mapInstance)}
        markers={markers}
        enableClusters={true}
      />
      {map && <GeoLayers map={map} />}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
