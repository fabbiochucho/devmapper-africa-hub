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
import { useState } from "react";

export default function Index() {
  const { user: authUser, loading } = useAuth();
  const { isAuthenticated, loading: roleLoading } = useUserRole();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedMapProject, setSelectedMapProject] = useState<any | null>(null);

  // Show loading state while authentication is being determined
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

  // If user is authenticated, show the unified dashboard
  if (isAuthenticated && authUser) {
    return <UnifiedDashboard />;
  }

  // Mock data for social feed
  const socialMediaFeeds = [
    {
      platform: "Twitter",
      user: "@devadvocate",
      content: "Just used #DevMapper to report a new school being built in my village. Transparency is key for development! Great platform.",
      avatar: "/placeholder.svg",
    },
    {
      platform: "LinkedIn",
      user: "Amina Okoro, NGO Director",
      content: "Our team at 'Educate Africa' is now using DevMapper to track our projects. The analytics dashboard provides incredible insights into our SDG alignment.",
      avatar: "/placeholder.svg",
    },
    {
      platform: "Facebook",
      user: "John Mensah",
      content: "It's amazing to see so many projects mapped out across Ghana on DevMapper. I just verified a clean water well project near me. Feeling empowered!",
      avatar: "/placeholder.svg",
    },
    {
      platform: "Twitter",
      user: "@EcoWarriorJane",
      content: "Kudos to the DevMapper team for creating a tool that holds organizations accountable. Following the progress of the solar farm installation in Kenya.",
      avatar: "/placeholder.svg",
    },
  ];

  // Mock data for map (this could be moved to a separate component later)
  const projectsForMap = [
    {
      id: 1,
      title: "Solar Panel Installation",
      lat: -1.2921,
      lng: 36.8219,
      sdg_goal: 7,
      status: "In Progress",
      color: "#22c55e",
      budget: 50000,
    },
    {
      id: 2,
      title: "Water Well Project",
      lat: 5.6037,
      lng: -0.1870,
      sdg_goal: 6,
      status: "Completed",
      color: "#3b82f6",
      budget: 25000,
    },
    {
      id: 3,
      title: "Education Program",
      lat: 6.5244,
      lng: 3.3792,
      sdg_goal: 4,
      status: "Planning",
      color: "#eab308",
      budget: 15000,
    },
  ];

  const handleProjectSelect = (project: any) => {
    setSelectedMapProject(project?.id === selectedMapProject?.id ? null : project);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  return (
    <div className="min-h-screen bg-background" id="top">
      <PageHeader user={null} handleLogout={() => {}} setShowAuthModal={setShowAuthModal} />

      <main>
        <HeroSection user={null} setShowAuthModal={setShowAuthModal} />
        <StatsSection />
        <ChangeMakersSection />
        <HowItWorksSection />
        <MapSection 
          projects={projectsForMap} 
          onProjectSelect={handleProjectSelect} 
          selectedProject={selectedMapProject} 
        />
        <RecentProjects />
        <SocialFeed socialMediaFeeds={socialMediaFeeds} />
        <PartnersCarousel />
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