import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/contexts/UserRoleContext";
import { useTypewriter } from "@/hooks/useTypewriter";
import { Link } from "react-router-dom";
import { ArrowRight, Play, MapPin, Users, Target, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDashboardStats } from "@/hooks/useDashboardStats";

interface UserType {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  verified: boolean;
  organization?: string;
  country?: string;
}

interface HeroSectionProps {
  user: UserType | null;
  setShowAuthModal: (show: boolean) => void;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k+`;
  return n > 0 ? `${n.toLocaleString()}+` : '0';
}

export default function HeroSection({ user, setShowAuthModal }: HeroSectionProps) {
  const { t } = useTranslation();
  const [typewriterKey, setTypewriterKey] = useState(0);
  const { data: stats } = useDashboardStats();

  useEffect(() => {
    const interval = setInterval(() => {
      setTypewriterKey((prevKey) => prevKey + 1);
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const { displayText: typedTitle, isFinished: titleIsFinished } = useTypewriter(
    t('hero.title'),
    50,
    typewriterKey
  );

  const heroStats = [
    { icon: MapPin, label: t('hero.projectsMapped'), value: stats ? formatNumber(stats.total_reports) : "—" },
    { icon: Users, label: t('hero.activeUsers'), value: stats ? formatNumber(stats.total_change_makers) : "—" },
    { icon: Target, label: t('hero.sdgGoalsTracked'), value: "17" },
    { icon: CheckCircle, label: "Countries Reached", value: stats ? formatNumber(stats.countries_count) : "—" },
  ];

  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-primary" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary-foreground/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-primary-foreground/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </div>
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm px-4 py-2 rounded-full text-primary-foreground/90 text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-foreground"></span>
              </span>
              {t('hero.liveTracking')}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 min-h-[120px] md:min-h-[144px]">
              {typedTitle}
              {!titleIsFinished && <span className="inline-block animate-pulse w-1 h-12 bg-primary-foreground ml-1"></span>}
            </h1>
            
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-xl mx-auto lg:mx-0">
              {t('hero.subtitle')}
            </p>
            
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold text-lg px-8 py-6 h-auto group"
                  onClick={() => setShowAuthModal(true)}
                >
                  {t('hero.getStarted')}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 font-semibold text-lg px-8 py-6 h-auto"
                  asChild
                >
                  <Link to="/about">
                    <Play className="mr-2 h-5 w-5" />
                    {t('hero.watchDemo')}
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4">
            {heroStats.map((stat, i) => (
              <div key={i} className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20 hover:bg-primary-foreground/15 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary-foreground/20 rounded-lg">
                    <stat.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-primary-foreground/80 text-sm font-medium">{stat.label}</span>
                </div>
                <p className="text-3xl font-bold text-primary-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
