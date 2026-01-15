import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, 
  CheckCircle2, 
  BarChart3, 
  Globe2, 
  Briefcase, 
  Users 
} from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Interactive Mapping",
    description: "Visualize development projects across Africa with real-time geospatial data and filtering.",
  },
  {
    icon: CheckCircle2,
    title: "Community Verification",
    description: "Crowdsourced verification ensures data accuracy through local community validation.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track SDG progress with comprehensive dashboards, charts, and exportable reports.",
  },
  {
    icon: Globe2,
    title: "SDG & Agenda 2063",
    description: "Align projects with UN SDGs and African Union Agenda 2063 goals automatically.",
  },
  {
    icon: Briefcase,
    title: "ESG Reporting",
    description: "Comprehensive ESG metrics tracking for corporations with scenario analysis tools.",
  },
  {
    icon: Users,
    title: "Partner Network",
    description: "Connect with NGOs, governments, and corporations working toward shared goals.",
  },
];

export default function FeaturesGridSection() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Platform Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Track Impact
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive platform designed for communities, organizations, and governments 
            to monitor and celebrate sustainable development.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 border bg-card hover:border-primary/50"
            >
              <CardContent className="p-6">
                <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
