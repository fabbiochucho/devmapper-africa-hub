import { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense } from "react";
import { Outlet, useNavigate, Link, createSearchParams } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Report } from "@/data/mockReports";
import { Button } from "./ui/button";
import { Home, ArrowLeft, LogOut, MessageCircle, Search } from "lucide-react";
import PWAInstallPrompt from "./pwa/PWAInstallPrompt";
import MobileBottomNav from "./navigation/MobileBottomNav";
import NotificationCenter from "./notifications/NotificationCenter";
import GlobalSearch from "./search/GlobalSearch";
import OnboardingWizard from "./onboarding/OnboardingWizard";
import SessionTimeoutWarning from "./SessionTimeoutWarning";

import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/UserRoleContext";
import PageFooter from "./landing/PageFooter";
import { Badge } from "./ui/badge";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

const roleDisplayNames: Record<string, string> = {
  'citizen_reporter': 'Citizen',
  'ngo_member': 'NGO',
  'government_official': 'Gov',
  'company_representative': 'Corp',
  'country_admin': 'Country Admin',
  'platform_admin': 'Platform Admin',
  'change_maker': 'Change Maker',
  'admin': 'Admin'
};

// Memoized header component to prevent re-renders
const LayoutHeader = memo(({ 
  user, 
  profile, 
  currentRole, 
  onLogout, 
  onSearchOpen 
}: {
  user: any;
  profile: any;
  currentRole: string;
  onLogout: () => void;
  onSearchOpen: () => void;
}) => {
  const { t } = useTranslation();
  
  return (
    <header className="bg-card shadow-sm border-b z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/06a46dda-ed52-44ed-8f8e-2edb1752ffa6.png" 
              alt="Dev Mapper Logo" 
              className="w-10 h-10 mr-2"
              loading="eager"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">Dev Mapper</h1>
              <p className="text-[10px] text-muted-foreground">Africa SDG Tracker</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* Global Search Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSearchOpen}
              className="hidden sm:flex gap-2"
            >
              <Search className="w-4 h-4" />
              <span className="text-muted-foreground">Search...</span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            <LanguageSwitcher />
            
            {user && <NotificationCenter />}
            
            <Button variant="outline" size="sm" asChild className="hidden lg:flex">
              <Link to="/contact">
                <MessageCircle className="w-4 h-4 mr-2" />
                {t('nav.contactUs')}
              </Link>
            </Button>

            {user && (
              <>
                <Badge variant="secondary" className="hidden md:flex text-xs">
                  {roleDisplayNames[currentRole] || currentRole}
                </Badge>
                <span className="text-xs text-muted-foreground hidden lg:block max-w-24 truncate">
                  {profile?.full_name || user.email?.split('@')[0]}
                </span>
                <Button variant="outline" size="sm" onClick={onLogout}>
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">{t('nav.logout')}</span>
                </Button>
              </>
            )}

            {!user && (
              <Button size="sm" asChild>
                <Link to="/auth">{t('nav.signIn')}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

LayoutHeader.displayName = 'LayoutHeader';

const Layout = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, session, isAdmin } = useAuth();
  const { currentRole, setCurrentRole } = useUserRole();
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Optimized onboarding check - single batched query
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!session?.user) return;
      
      // Batch both queries in parallel
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, country")
          .eq("user_id", session.user.id)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("is_active", true)
      ]);

      const profileData = profileResult.data;
      const roles = rolesResult.data;

      // Admins skip onboarding entirely
      const hasAdminRole = roles?.some((r: any) => 
        ['admin', 'platform_admin', 'country_admin'].includes(r.role)
      );
      if (hasAdminRole) return;

      const needsOnboarding = !profileData?.full_name || !profileData?.country || !roles?.length;
      
      // Only show once per session
      const onboardingShown = sessionStorage.getItem("onboarding_shown");
      if (needsOnboarding && !onboardingShown) {
        setShowOnboarding(true);
        sessionStorage.setItem("onboarding_shown", "true");
      }
    };

    checkOnboarding();
  }, [session?.user?.id]);

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    setCurrentRole('citizen_reporter');
    navigate("/");
  }, [signOut, setCurrentRole, navigate]);

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    window.location.reload();
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex flex-col bg-background">
        <LayoutHeader 
          user={user}
          profile={profile}
          currentRole={currentRole}
          onLogout={handleLogout}
          onSearchOpen={handleSearchOpen}
        />

        {/* Main Content Area with Sidebar */}
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col">
            <main className="p-4 flex-1 flex flex-col pb-20 md:pb-4">
              <header className="flex justify-between items-center mb-4 gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <SidebarTrigger />
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link to="/">
                      <Home className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                {/* Mobile search button */}
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8 sm:hidden"
                  onClick={handleSearchOpen}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </header>
              <div className="flex-grow overflow-auto">
                <Outlet />
              </div>
            </main>

            {/* Footer - Hidden on mobile */}
            <div className="hidden md:block">
              <PageFooter />
            </div>
          </SidebarInset>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
        
        {/* Global Search Dialog */}
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        
        {/* Onboarding Wizard */}
        {showOnboarding && (
          <OnboardingWizard open={showOnboarding} onComplete={handleOnboardingComplete} />
        )}

        <PWAInstallPrompt />
        
        {/* Session Timeout Warning */}
        <SessionTimeoutWarning />
      </div>
    </SidebarProvider>
  );
};

export default Layout;
