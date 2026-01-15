import { Clock, TrendingUp, Smartphone, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const reasons = [
  {
    icon: Clock,
    title: "2030 Deadline Approaching",
    description: "With only 5 years until the UN SDG deadline, tracking progress has never been more critical. Every project counted brings us closer to achieving global development goals.",
    stat: "5 Years",
    statLabel: "Until SDG 2030"
  },
  {
    icon: TrendingUp,
    title: "Africa's Development Momentum",
    description: "Africa is experiencing unprecedented economic growth and infrastructure development. Capturing this momentum through proper tracking ensures sustainable, equitable progress.",
    stat: "$2.5T",
    statLabel: "Projected GDP by 2030"
  },
  {
    icon: Smartphone,
    title: "Digital Transformation Era",
    description: "Mobile penetration across Africa has reached new heights, enabling community-driven data collection at scale. Technology is finally meeting the moment.",
    stat: "600M+",
    statLabel: "Mobile Users in Africa"
  },
  {
    icon: Globe,
    title: "Global ESG Investment Surge",
    description: "International investors increasingly require ESG-compliant project data. DevMapper bridges the gap between African development and global impact investment standards.",
    stat: "$50T+",
    statLabel: "Global ESG Assets by 2025"
  }
];

export default function WhyNowSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            The Moment is Now
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Development Tracking Matters <span className="text-primary">Right Now</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Unprecedented convergence of urgency, opportunity, and technology creates the perfect 
            moment for community-driven development tracking in Africa.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {reasons.map((reason, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/50 hover:border-l-primary"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <reason.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{reason.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{reason.description}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">{reason.stat}</span>
                      <span className="text-sm text-muted-foreground">{reason.statLabel}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
