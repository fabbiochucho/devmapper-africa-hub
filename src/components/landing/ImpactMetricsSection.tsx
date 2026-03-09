import { useRef, useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Globe2, CheckCircle, DollarSign, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDashboardStats } from '@/hooks/useDashboardStats';

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k+`;
  return n > 0 ? n.toLocaleString() : '0';
}

/** Animated counter that counts up when visible */
function useCountUp(end: number, duration = 2000, isVisible: boolean) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current || end <= 0) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, isVisible]);

  return count;
}

export default function ImpactMetricsSection() {
  const { t } = useTranslation();
  const { data: stats } = useDashboardStats();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const countriesCount = useCountUp(stats?.countries_count || 0, 1500, isVisible);
  const changeMakers = useCountUp(stats?.total_change_makers || 0, 2000, isVisible);
  const reports = useCountUp(stats?.total_reports || 0, 2000, isVisible);
  const fundsRaised = useCountUp(stats?.total_funds_raised || 0, 2500, isVisible);
  const campaigns = useCountUp(stats?.total_campaigns || 0, 1800, isVisible);

  const metrics = [
    { icon: Globe2, value: stats ? String(countriesCount) : "—", label: t('impact.africanCountries'), description: t('impact.africanCountriesDesc') },
    { icon: Users, value: stats ? fmt(changeMakers) : "—", label: t('impact.activeChangeMakers'), description: t('impact.activeChangeMakersDesc') },
    { icon: CheckCircle, value: stats ? fmt(reports) : "—", label: t('impact.verifiedProjects'), description: t('impact.verifiedProjectsDesc') },
    { icon: DollarSign, value: stats ? `$${fmt(fundsRaised)}` : "—", label: t('impact.fundsTracked'), description: t('impact.fundsTrackedDesc') },
    { icon: Building2, value: stats ? fmt(campaigns) : "—", label: t('impact.partnerOrgs'), description: t('impact.partnerOrgsDesc') },
    { icon: TrendingUp, value: "17", label: t('impact.sdgGoalsMapped'), description: t('impact.sdgGoalsMappedDesc') },
  ];

  return (
    <section ref={sectionRef} className="py-16 bg-primary text-primary-foreground" aria-label="Impact metrics">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('impact.title')}</h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">{t('impact.subtitle')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((metric, index) => (
            <Card 
              key={index} 
              className="bg-primary-foreground/10 border-primary-foreground/20 text-center hover:bg-primary-foreground/15 transition-all duration-300 hover:scale-105"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <metric.icon className="h-8 w-8 mx-auto mb-3 text-primary-foreground/80" aria-hidden="true" />
                <div className="text-3xl font-bold mb-1 tabular-nums">{metric.value}</div>
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
