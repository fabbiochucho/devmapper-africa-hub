import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">{t('howItWorks.title')}</h3>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <MapPin className="w-12 h-12 text-primary mb-4" />
              <CardTitle>{t('howItWorks.reportTitle')}</CardTitle>
              <CardDescription>{t('howItWorks.reportDesc')}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Users className="w-12 h-12 text-primary mb-4" />
              <CardTitle>{t('howItWorks.verifyTitle')}</CardTitle>
              <CardDescription>{t('howItWorks.verifyDesc')}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <TrendingUp className="w-12 h-12 text-primary mb-4" />
              <CardTitle>{t('howItWorks.trackTitle')}</CardTitle>
              <CardDescription>{t('howItWorks.trackDesc')}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  );
}
