
import MapIntegration from "@/components/MapIntegration";
import SdgDistributionChart from "@/components/SdgDistributionChart";

interface MapSectionProps {
  projects: any[];
  onProjectSelect: (project: any) => void;
  selectedProject: any | null;
}

export default function MapSection({ projects, onProjectSelect, selectedProject }: MapSectionProps) {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-foreground mb-4">Explore Projects on the Map</h3>
              <p className="text-xl text-muted-foreground max-w-3xl">
                Visually track the progress and location of development projects across the continent.
              </p>
            </div>
            <MapIntegration 
              projects={projects} 
              onProjectSelect={onProjectSelect} 
              selectedProject={selectedProject} 
            />
          </div>
          <div>
            <SdgDistributionChart />
          </div>
        </div>
      </div>
    </section>
  );
}
