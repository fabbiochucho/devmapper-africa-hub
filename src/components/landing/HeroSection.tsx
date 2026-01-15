import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/contexts/UserRoleContext";
import { useTypewriter } from "@/hooks/useTypewriter";
import { Link } from "react-router-dom";
import { ArrowRight, Play, MapPin, Users, Target, CheckCircle } from "lucide-react";

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

export default function HeroSection({ user, setShowAuthModal }: HeroSectionProps) {
  const [typewriterKey, setTypewriterKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTypewriterKey((prevKey) => prevKey + 1);
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const { displayText: typedTitle, isFinished: titleIsFinished } = useTypewriter(
    "Track Sustainable Development Across Africa",
    50,
    typewriterKey
  );

  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden">
      {/* Enhanced gradient background using semantic tokens */}
      <div className="absolute inset-0 bg-primary" />
      
      {/* Animated background patterns */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary-foreground/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-primary-foreground/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </div>
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm px-4 py-2 rounded-full text-primary-foreground/90 text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-foreground"></span>
              </span>
              Live tracking across 54 African nations
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 min-h-[120px] md:min-h-[144px]">
              {typedTitle}
              {!titleIsFinished && <span className="inline-block animate-pulse w-1 h-12 bg-primary-foreground ml-1"></span>}
            </h1>
            
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-xl mx-auto lg:mx-0">
              DevMapper empowers communities to report, verify, and track development projects 
              aligned with the UN Sustainable Development Goals and AU Agenda 2063.
            </p>
            
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold text-lg px-8 py-6 h-auto group"
                  onClick={() => setShowAuthModal(true)}
                >
                  Get Started Free
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
                    Watch Demo
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Right content - Stats cards */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20 hover:bg-primary-foreground/15 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary-foreground/20 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-primary-foreground/80 text-sm font-medium">Projects Mapped</span>
              </div>
              <p className="text-3xl font-bold text-primary-foreground">10,000+</p>
            </div>
            
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20 hover:bg-primary-foreground/15 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary-foreground/20 rounded-lg">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-primary-foreground/80 text-sm font-medium">Active Users</span>
              </div>
              <p className="text-3xl font-bold text-primary-foreground">5,000+</p>
            </div>
            
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20 hover:bg-primary-foreground/15 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary-foreground/20 rounded-lg">
                  <Target className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-primary-foreground/80 text-sm font-medium">SDG Goals Tracked</span>
              </div>
              <p className="text-3xl font-bold text-primary-foreground">17</p>
            </div>
            
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20 hover:bg-primary-foreground/15 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary-foreground/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-primary-foreground/80 text-sm font-medium">Verified Reports</span>
              </div>
              <p className="text-3xl font-bold text-primary-foreground">8,500+</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
