
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { MapPin, List, BarChart2, Settings, User, LogOut, PlusCircle } from "lucide-react";
import UserRoleSwitcher from "./UserRoleSwitcher";
import { useUserRole } from "@/contexts/UserRoleContext";

const AppSidebar = () => {
  const { role } = useUserRole();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-2">
          <h1 className="text-xl font-semibold">DevMapper</h1>
          <p className="text-sm text-muted-foreground">Africa SDG Tracker</p>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
        <div className="flex-1">
          <div className="p-2">
            <Button asChild className="w-full">
              <NavLink to="/submit-report">
                <PlusCircle className="mr-2 h-4 w-4" />
                Submit Report
              </NavLink>
            </Button>
          </div>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <NavLink to="/" end>
                  {({ isActive }) => (
                    <SidebarMenuButton isActive={isActive}>
                      <MapPin />
                      <span>Map Dashboard</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <NavLink to="/reports">
                  {({ isActive }) => (
                    <SidebarMenuButton isActive={isActive}>
                      <List />
                      <span>Reports</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <NavLink to="/analytics">
                  {({ isActive }) => (
                    <SidebarMenuButton isActive={isActive}>
                      <BarChart2 />
                      <span>Analytics</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <NavLink to="/settings">
                {({ isActive }) => (
                  <SidebarMenuButton isActive={isActive}>
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <div className="flex items-center gap-3 p-2 border-t">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Guest User</span>
            <span className="text-xs text-muted-foreground">{role}</span>
          </div>
        </div>
        <UserRoleSwitcher />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
