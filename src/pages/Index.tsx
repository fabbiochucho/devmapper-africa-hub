import { useState, useEffect } from "react";
import AuthModal from "@/components/AuthModal";
import { useUserRole, UserRole } from "@/contexts/UserRoleContext";
import { mockReports, Report } from "@/data/mockReports";
import PageHeader from "@/components/landing/PageHeader";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import ChangeMakersSection from "@/components/landing/ChangeMakersSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import MapSection from "@/components/landing/MapSection";
import RecentProjects from "@/components/landing/RecentProjects";
import SocialFeed from "@/components/landing/SocialFeed";
import UserDashboard from "@/components/landing/UserDashboard";
import PageFooter from "@/components/landing/PageFooter";

interface UserType {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  verified: boolean;
  organization?: string;
  country?: string;
}

export default function Index() {
  const [user, setUser] = useState<UserType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { setCurrentRole } = useUserRole();
  const [selectedMapProject, setSelectedMapProject] = useState<any | null>(null);

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

  const recentProjects = mockReports
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 10);

  const handleProjectSelect = (project: any) => {
    if (selectedMapProject && selectedMapProject.id === project.id) {
      setSelectedMapProject(null);
    } else {
      setSelectedMapProject(project);
    }
  };

  const getStatusInfo = (status: Report["project_status"]): { name: string; color: string } => {
    switch (status) {
      case "in_progress": return { name: "Confirmed", color: "#22c55e" };
      case "planned": return { name: "Pending", color: "#eab308" };
      case "completed": return { name: "Completed", color: "#3b82f6" };
      case "stalled": return { name: "Stalled", color: "#ef4444" };
      case "cancelled": return { name: "Cancelled", color: "#6b7280" };
      default: return { name: "Unknown", color: "#6b7280" };
    }
  };

  const projectsForMap = mockReports.map(report => {
    if (!report.lat || !report.lng) return null;
    const statusInfo = getStatusInfo(report.project_status);
    return {
      id: parseInt(report.id.replace("REP-", "")),
      title: report.title,
      lat: report.lat,
      lng: report.lng,
      sdg_goal: parseInt(report.sdg_goal),
      status: statusInfo.name,
      color: statusInfo.color,
      budget: report.cost || 0,
    };
  }).filter(Boolean) as any[];

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setCurrentRole(parsedUser.role);
      } catch (error) {
        console.error("Error parsing user data:", error);
        handleLogout();
      }
    }
    setIsLoading(false);
  }, [setCurrentRole]);

  const handleAuthSuccess = (userData: UserType, token: string) => {
    setUser(userData);
    setCurrentRole(userData.role);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setUser(null);
    setCurrentRole("Citizen Reporter"); 
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading DevMapper...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" id="top">
      <PageHeader user={user} handleLogout={handleLogout} setShowAuthModal={setShowAuthModal} />

      <main>
        <HeroSection user={user} setShowAuthModal={setShowAuthModal} />
        <StatsSection />
        <ChangeMakersSection />
        <HowItWorksSection />
        <MapSection projects={projectsForMap} onProjectSelect={handleProjectSelect} selectedProject={selectedMapProject} />
        <RecentProjects recentProjects={recentProjects} />
        <SocialFeed socialMediaFeeds={socialMediaFeeds} />
        {user && <UserDashboard user={user} />}
      </main>

      <PageFooter />

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}
