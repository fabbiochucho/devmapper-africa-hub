
import EnhancedProjectMap from "@/components/map/EnhancedProjectMap";
import SdgDistributionChart from "@/components/SdgDistributionChart";

export default function MapSection() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-stretch">
          <div>
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-foreground mb-4">Explore Projects with Earth Intelligence</h3>
              <p className="text-xl text-muted-foreground max-w-3xl">
                Visually track projects with real-time Earth observation data including vegetation, water, urban development, and emissions.
              </p>
            </div>
            <EnhancedProjectMap />
          </div>
          <div>
            <SdgDistributionChart />
          </div>
        </div>
      </div>
    </section>
  );
}
