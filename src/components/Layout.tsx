
import { Outlet, useNavigate, Link, createSearchParams } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import SearchInterface from "./search/SearchInterface";
import { Report } from "@/data/mockReports";
import { Organization } from "@/data/mockOrganizations";
import { Button } from "./ui/button";
import { Home, ArrowLeft, LogOut, MessageCircle } from "lucide-react";
import NotificationBell from "./notifications/NotificationBell";
import PWAInstallPrompt from "./pwa/PWAInstallPrompt";

import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/UserRoleContext";
import PageFooter from "./landing/PageFooter";
import { Badge } from "./ui/badge";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

const Layout = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { currentRole, setCurrentRole } = useUserRole();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await signOut();
    setCurrentRole('citizen_reporter');
    navigate("/");
  };

  const handleProjectSelect = (project: Report) => {
    navigate({
      pathname: '/analytics',
      search: createSearchParams({
        tab: 'reports',
        id: project.id
      }).toString()
    });
  };

  const handleUserSelect = (user: { id: string; full_name: string | null; avatar_url: string | null }) => {
    console.log("Selected user:", user);
  };

  const handleOrganizationSelect = (org: Organization) => {
    console.log("Selected organization:", org);
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'citizen_reporter': 'Citizen Reporter',
      'ngo_member': 'NGO Member',
      'government_official': 'Government Official',
      'company_representative': 'Corporate Rep',
      'country_admin': 'Country Admin',
      'platform_admin': 'Platform Admin',
      'change_maker': 'Change Maker',
      'admin': 'Administrator'
    };
    return roleMap[role] || role;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex flex-col bg-background">
        {/* Top Header Bar */}
        <header className="bg-card shadow-sm border-b z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center">
                <img 
                  src="/lovable-uploads/06a46dda-ed52-44ed-8f8e-2edb1752ffa6.png" 
                  alt="Dev Mapper Logo" 
                  className="w-12 h-12 mr-3"
                />
                <div>
                  <h1 className="text-xl font-bold text-foreground">Dev Mapper</h1>
                  <p className="text-xs text-muted-foreground font-medium">Africa SDG Tracker</p>
                </div>
              </Link>

              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                {user && <NotificationBell />}
                <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                  <Link to="/contact">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {t('nav.contactUs')}
                  </Link>
                </Button>

                {user && (
                  <>
                    <Badge variant="secondary" className="hidden md:flex">
                      {getRoleDisplayName(currentRole)}
                    </Badge>
                    <span className="text-sm text-muted-foreground hidden md:block">
                      {profile?.full_name || user.email}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">{t('nav.logout')}</span>
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

        {/* Main Content Area with Sidebar */}
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col">
            <main className="p-4 flex-1 flex flex-col">
              <header className="flex justify-between items-center mb-4 gap-4 shrink-0">
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
                <div className="flex-grow max-w-lg ml-auto">
                  <SearchInterface 
                    onProjectSelect={handleProjectSelect}
                    onUserSelect={handleUserSelect}
                    onOrganizationSelect={handleOrganizationSelect}
                  />
                </div>
              </header>
              <div className="flex-grow overflow-auto">
                <Outlet />
              </div>
            </main>

            {/* Footer */}
            <PageFooter />
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
