
import { NavLink, useMatch, Link } from "react-router-dom";
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
import { MapPin, BarChart2, Settings, User, LogOut, PlusCircle, Users, MessageSquare } from "lucide-react";
import UserRoleSwitcher from "./UserRoleSwitcher";
import { useUserRole } from "@/contexts/UserRoleContext";

const SidebarNavLink = ({ to, end, icon: Icon, children }: { to: string, end?: boolean, icon: React.ElementType, children: React.ReactNode }) => {
  const match = useMatch({ path: to, end });

  return (
    <SidebarMenuItem>
      <NavLink to={to} end={end}>
        <SidebarMenuButton isActive={!!match}>
          <Icon />
          <span>{children}</span>
        </SidebarMenuButton>
      </NavLink>
    </SidebarMenuItem>
  );
};


const AppSidebar = () => {
  const { role } = useUserRole();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/" className="block p-2">
          <h1 className="text-xl font-semibold">DevMapper</h1>
          <p className="text-sm text-muted-foreground">Africa SDG Tracker</p>
        </Link>
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
              <SidebarNavLink to="/" end icon={MapPin}>Map Dashboard</SidebarNavLink>
              <SidebarNavLink to="/analytics" icon={BarChart2}>Analytics</SidebarNavLink>
              <SidebarNavLink to="/forum" icon={Users}>Community Forum</SidebarNavLink>
              <SidebarNavLink to="/messages" icon={MessageSquare}>Messages</SidebarNavLink>
            </SidebarMenu>
          </SidebarGroup>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarNavLink to="/settings" icon={Settings}>Settings</SidebarNavLink>
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
