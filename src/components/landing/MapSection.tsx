
import { useState, useEffect } from "react";
import MapIntegration from "@/components/MapIntegration";
import SdgDistributionChart from "@/components/SdgDistributionChart";
import { supabase } from "@/integrations/supabase/client";

interface MapProject {
  id: number;
  title: string;
  lat: number;
  lng: number;
  sdg_goal: number;
  status: string;
  color: string;
  budget: number;
}

export default function MapSection() {
  const [projects, setProjects] = useState<MapProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<MapProject | null>(null);
  const [loading, setLoading] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'in_progress': return '#3b82f6';
      case 'planned': return '#eab308';
      default: return '#6b7280';
    }
  };

  useEffect(() => {
    const fetchMapProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('id, title, lat, lng, sdg_goal, project_status, cost')
          .not('lat', 'is', null)
          .not('lng', 'is', null)
          .limit(50);

        if (error) throw error;

        const mapProjects = data?.map((report, index) => ({
          id: index + 1, // Convert to number for compatibility
          title: report.title,
          lat: Number(report.lat),
          lng: Number(report.lng),
          sdg_goal: report.sdg_goal,
          status: report.project_status,
          color: getStatusColor(report.project_status),
          budget: Number(report.cost || 0)
        })) || [];

        setProjects(mapProjects);
      } catch (error) {
        console.error('Error fetching map projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMapProjects();
  }, []);

  const handleProjectSelect = (project: MapProject) => {
    setSelectedProject(project?.id === selectedProject?.id ? null : project);
  };

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-stretch">
          <div>
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-foreground mb-4">Explore Projects on the Map</h3>
              <p className="text-xl text-muted-foreground max-w-3xl">
                Visually track the progress and location of development projects across the continent.
              </p>
            </div>
            {loading ? (
              <div className="h-96 flex items-center justify-center border rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <MapIntegration 
                projects={projects} 
                onProjectSelect={handleProjectSelect} 
                selectedProject={selectedProject} 
              />
            )}
          </div>
          <div>
            <SdgDistributionChart />
          </div>
        </div>
      </div>
    </section>
  );
}
