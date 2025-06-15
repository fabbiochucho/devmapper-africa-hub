
import { Outlet, useNavigate, Link } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import SearchInterface from "./search/SearchInterface";
import { Report } from "@/data/mockReports";
import { MockUser } from "@/data/mockUsers";
import { Organization } from "@/data/mockOrganizations";
import { Button } from "./ui/button";
import { ArrowLeft, Home } from "lucide-react";

const Layout = () => {
  const navigate = useNavigate();

  const handleProjectSelect = (project: Report) => {
    navigate(`/analytics?tab=reports&id=${project.id}`);
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
        <AppSidebar />
        <SidebarInset className="flex-1">
          <main className="p-4 h-full flex flex-col">
            <header className="flex justify-between items-center mb-4 gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" asChild aria-label="Go home">
                  <Link to="/">
                    <Home className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="flex-grow max-w-lg">
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

