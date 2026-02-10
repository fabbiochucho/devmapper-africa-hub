import { Card, CardContent } from "@/components/ui/card";
import { MapPin, CheckCircle2, BarChart3, Globe2, Briefcase, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function FeaturesGridSection() {
  const { t } = useTranslation();

  const features = [
    { icon: MapPin, title: t('features.interactiveMapping'), description: t('features.interactiveMappingDesc') },
    { icon: CheckCircle2, title: t('features.communityVerification'), description: t('features.communityVerificationDesc') },
    { icon: BarChart3, title: t('features.realTimeAnalytics'), description: t('features.realTimeAnalyticsDesc') },
    { icon: Globe2, title: t('features.sdgAgenda'), description: t('features.sdgAgendaDesc') },
    { icon: Briefcase, title: t('features.esgReporting'), description: t('features.esgReportingDesc') },
    { icon: Users, title: t('features.partnerNetwork'), description: t('features.partnerNetworkDesc') },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {t('features.badge')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 border bg-card hover:border-primary/50">
              <CardContent className="p-6">
                <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
