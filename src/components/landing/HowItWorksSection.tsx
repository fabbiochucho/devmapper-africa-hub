import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Award, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function HowItWorksSection() {
  const { t } = useTranslation();

  const steps = [
    { icon: MapPin, title: t('howItWorks.reportTitle'), desc: t('howItWorks.reportDesc'), step: "01" },
    { icon: Users, title: t('howItWorks.verifyTitle'), desc: t('howItWorks.verifyDesc'), step: "02" },
    { icon: Award, title: t('howItWorks.scoreTitle', { defaultValue: 'Score' }), desc: t('howItWorks.scoreDesc', { defaultValue: 'Each project is assigned a credibility and impact score based on evidence strength, verification depth, and outcome achievement.' }), step: "03" },
    { icon: TrendingUp, title: t('howItWorks.trackTitle'), desc: t('howItWorks.trackDesc'), step: "04" },
  ];

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">{t('howItWorks.title')}</h3>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="relative group hover:shadow-lg transition-all duration-300 border hover:border-primary/50">
              <CardHeader>
                <div className="absolute -top-3 -left-3 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
                <step.icon className="w-10 h-10 text-primary mb-4 mt-2" />
                <CardTitle className="text-lg">{step.title}</CardTitle>
                <CardDescription>{step.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
