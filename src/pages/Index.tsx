import { useEffect } from "react";
import AuthModal from "@/components/AuthModal";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useAuth } from "@/contexts/AuthContext";
import UnifiedDashboard from "@/components/UnifiedDashboard";
import { useState } from "react";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesGridSection from "@/components/landing/FeaturesGridSection";
import MapSection from "@/components/landing/MapSection";
import WhyNowSection from "@/components/landing/WhyNowSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ImpactMetricsSection from "@/components/landing/ImpactMetricsSection";
import ChangeMakersSection from "@/components/landing/ChangeMakersSection";
import PartnersCarousel from "@/components/landing/PartnersCarousel";
import FinalCTASection from "@/components/landing/FinalCTASection";
import SdgCarousel from "@/components/landing/SdgCarousel";

export default function Index() {
  const { user: authUser, loading } = useAuth();
  const { isAuthenticated, loading: roleLoading } = useUserRole();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && authUser) {
    return <UnifiedDashboard />;
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  return (
    <div className="space-y-0">
      <HeroSection user={null} setShowAuthModal={setShowAuthModal} />
      <SdgCarousel />
      <FeaturesGridSection />
      <WhyNowSection />
      <MapSection />
      <HowItWorksSection />
      <ImpactMetricsSection />
      <ChangeMakersSection />
      <PartnersCarousel />
      <FinalCTASection onGetStarted={() => setShowAuthModal(true)} />

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onAuthSuccess={handleAuthSuccess} 
      />
    </div>
  );
}
