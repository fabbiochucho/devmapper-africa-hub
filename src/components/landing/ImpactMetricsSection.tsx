import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Globe2, CheckCircle, DollarSign, Building2 } from 'lucide-react';

const metrics = [
  {
    icon: Globe2,
    value: "54",
    label: "African Countries",
    description: "Coverage across the entire continent"
  },
  {
    icon: Users,
    value: "5,000+",
    label: "Active Change Makers",
    description: "Community members driving impact"
  },
  {
    icon: CheckCircle,
    value: "8,500+",
    label: "Verified Projects",
    description: "Community-verified development initiatives"
  },
  {
    icon: DollarSign,
    value: "$2.5M+",
    label: "Funds Tracked",
    description: "Development investment monitored"
  },
  {
    icon: Building2,
    value: "150+",
    label: "Partner Organizations",
    description: "NGOs, governments, and corporates"
  },
  {
    icon: TrendingUp,
    value: "17",
    label: "SDG Goals Mapped",
    description: "Full UN SDG framework coverage"
  }
];

export default function ImpactMetricsSection() {
  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our Impact in Numbers
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            Real data from real communities driving sustainable development across Africa.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((metric, index) => (
            <Card 
              key={index} 
              className="bg-primary-foreground/10 border-primary-foreground/20 text-center hover:bg-primary-foreground/15 transition-colors"
            >
              <CardContent className="p-6">
                <metric.icon className="h-8 w-8 mx-auto mb-3 text-primary-foreground/80" />
                <div className="text-3xl font-bold mb-1">{metric.value}</div>
                <div className="font-medium text-sm mb-1">{metric.label}</div>
                <div className="text-xs text-primary-foreground/60">{metric.description}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
