
import { Outlet, useNavigate, Link, createSearchParams } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import SearchInterface from "./search/SearchInterface";
import { Report } from "@/data/mockReports";
import { Organization } from "@/data/mockOrganizations";
import { Button } from "./ui/button";
import { Home, ArrowLeft } from "lucide-react";
import UserRoleSwitcher from "./UserRoleSwitcher";
import { useAuth } from "@/contexts/AuthContext";

const Layout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleProjectSelect = (project: Report) => {
    navigate({
      pathname: '/analytics',
      search: createSearchParams({
        tab: 'reports',
        id: project.id
      }).toString()
    });
  };

  const handleUserSelect = (user: MockUser) => {
    console.log("Selected user:", user);
    // Future: navigate to user profile page
  };

  const handleOrganizationSelect = (org: Organization) => {
    console.log("Selected organization:", org);
    // Future: navigate to organization profile page
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        <div className="flex flex-col">
          <AppSidebar />
          {user && <UserRoleSwitcher />}
        </div>
        <SidebarInset className="flex-1">
          <main className="p-4 h-full flex flex-col">
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
