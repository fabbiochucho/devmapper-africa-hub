import { lazy, Suspense } from "react";
import AuthModal from "@/components/AuthModal";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useAuth } from "@/contexts/AuthContext";
import UnifiedDashboard from "@/components/UnifiedDashboard";
import { useState } from "react";
import HeroSection from "@/components/landing/HeroSection";
import SdgCarousel from "@/components/landing/SdgCarousel";
import FeaturesGridSection from "@/components/landing/FeaturesGridSection";

// Lazy load below-fold sections for faster initial paint
const WhyNowSection = lazy(() => import("@/components/landing/WhyNowSection"));
const MapSection = lazy(() => import("@/components/landing/MapSection"));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection"));
const ImpactMetricsSection = lazy(() => import("@/components/landing/ImpactMetricsSection"));
const ChangeMakersSection = lazy(() => import("@/components/landing/ChangeMakersSection"));
const PartnersCarousel = lazy(() => import("@/components/landing/PartnersCarousel"));
const FinalCTASection = lazy(() => import("@/components/landing/FinalCTASection"));

const SectionFallback = () => (
  <div className="py-16 flex items-center justify-center">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
  </div>
);

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
      {/* Above-the-fold: loaded eagerly */}
      <HeroSection user={null} setShowAuthModal={setShowAuthModal} />
      <SdgCarousel />
      <FeaturesGridSection />

      {/* Below-the-fold: lazy loaded */}
      <Suspense fallback={<SectionFallback />}>
        <WhyNowSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <MapSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <HowItWorksSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <ImpactMetricsSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <ChangeMakersSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <PartnersCarousel />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <FinalCTASection onGetStarted={() => setShowAuthModal(true)} />
      </Suspense>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onAuthSuccess={handleAuthSuccess} 
      />
    </div>
  );
}
