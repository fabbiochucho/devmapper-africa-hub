import { useEffect } from "react";
import AuthModal from "@/components/AuthModal";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/landing/PageHeader";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/StatsSection";
import ChangeMakersSection from "@/components/ChangeMakersSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import MapSection from "@/components/landing/MapSection";
import RecentProjects from "@/components/RecentProjects";
import SocialFeed from "@/components/landing/SocialFeed";
import UnifiedDashboard from "@/components/UnifiedDashboard";
import PartnersCarousel from "@/components/landing/PartnersCarousel";
import PageFooter from "@/components/landing/PageFooter";
import FeaturesGridSection from "@/components/landing/FeaturesGridSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import { useState } from "react";

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
    <div className="min-h-screen bg-background" id="top">
      <PageHeader user={null} handleLogout={() => {}} setShowAuthModal={setShowAuthModal} />

      <main>
        <HeroSection user={null} setShowAuthModal={setShowAuthModal} />
        <StatsSection />
        <FeaturesGridSection />
        <ChangeMakersSection />
        <HowItWorksSection />
        <MapSection />
        <RecentProjects />
        <SocialFeed />
        <PartnersCarousel />
        <FinalCTASection onGetStarted={() => setShowAuthModal(true)} />
      </main>

      <PageFooter />

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onAuthSuccess={handleAuthSuccess} 
      />
    </div>
  );
}
