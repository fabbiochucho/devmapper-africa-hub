import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Globe2, CheckCircle, DollarSign, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ImpactMetricsSection() {
  const { t } = useTranslation();

  const metrics = [
    { icon: Globe2, value: "54", label: t('impact.africanCountries'), description: t('impact.africanCountriesDesc') },
    { icon: Users, value: "5,000+", label: t('impact.activeChangeMakers'), description: t('impact.activeChangeMakersDesc') },
    { icon: CheckCircle, value: "8,500+", label: t('impact.verifiedProjects'), description: t('impact.verifiedProjectsDesc') },
    { icon: DollarSign, value: "$2.5M+", label: t('impact.fundsTracked'), description: t('impact.fundsTrackedDesc') },
    { icon: Building2, value: "150+", label: t('impact.partnerOrgs'), description: t('impact.partnerOrgsDesc') },
    { icon: TrendingUp, value: "17", label: t('impact.sdgGoalsMapped'), description: t('impact.sdgGoalsMappedDesc') },
  ];

  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('impact.title')}</h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">{t('impact.subtitle')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((metric, index) => (
            <Card key={index} className="bg-primary-foreground/10 border-primary-foreground/20 text-center hover:bg-primary-foreground/15 transition-colors">
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
