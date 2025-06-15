
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
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">Explore Projects on the Map</h3>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Visually track the progress and location of development projects across the continent.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <MapIntegration 
              projects={projects} 
              onProjectSelect={onProjectSelect} 
              selectedProject={selectedProject} 
            />
            <SdgDistributionChart topN={5} />
        </div>
      </div>
    </section>
  );
}

