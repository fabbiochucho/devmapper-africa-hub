import { Clock, TrendingUp, Smartphone, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export default function WhyNowSection() {
  const { t } = useTranslation();

  const reasons = [
    { icon: Clock, title: t('whyNow.deadline'), description: t('whyNow.deadlineDesc'), stat: t('whyNow.deadlineStat'), statLabel: t('whyNow.deadlineStatLabel') },
    { icon: TrendingUp, title: t('whyNow.momentum'), description: t('whyNow.momentumDesc'), stat: t('whyNow.momentumStat'), statLabel: t('whyNow.momentumStatLabel') },
    { icon: Smartphone, title: t('whyNow.digital'), description: t('whyNow.digitalDesc'), stat: t('whyNow.digitalStat'), statLabel: t('whyNow.digitalStatLabel') },
    { icon: Globe, title: t('whyNow.esg'), description: t('whyNow.esgDesc'), stat: t('whyNow.esgStat'), statLabel: t('whyNow.esgStatLabel') },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {t('whyNow.badge')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('whyNow.title')} <span className="text-primary">{t('whyNow.titleHighlight')}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('whyNow.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {reasons.map((reason, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/50 hover:border-l-primary">
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
