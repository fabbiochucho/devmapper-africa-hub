
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import SearchInterface from "./search/SearchInterface";
import { Report } from "@/data/mockReports";
import { MockUser } from "@/data/mockUsers";
import { Organization } from "@/data/mockOrganizations";

const Layout = () => {
  const navigate = useNavigate();

  const handleProjectSelect = (project: Report) => {
    navigate(`/reports?id=${project.id}`);
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
              <SidebarTrigger />
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
