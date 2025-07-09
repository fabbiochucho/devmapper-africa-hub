
import { Calendar, Home, Inbox, Search, Settings, Users, BarChart3, Target, Building2, Shield, MessageSquare, BookOpen, HelpCircle, FileText, Phone, Info, Heart, UserPlus, MapPin, TrendingUp } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// Menu items.
const mainItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Search", url: "/search", icon: Search },
  { title: "Change Makers", url: "/change-makers", icon: Users },
  { title: "Fundraising", url: "/fundraising", icon: Heart },
  { title: "Messages", url: "/messages", icon: Inbox },
  { title: "Forum", url: "/forum", icon: MessageSquare },
]

const analyticsItems = [
  { title: "Project Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Change Maker Analytics", url: "/change-maker-analytics", icon: TrendingUp },
]

const submissionItems = [
  { title: "Submit Report", url: "/submit-report", icon: FileText },
  { title: "Submit Change Maker", url: "/submit-change-maker", icon: UserPlus },
]

const getDashboardItems = (userRoles: string[], isAdmin: boolean) => {
  const items = [];
  
  if (userRoles.includes('company_representative')) {
    items.push({ title: "Corporate Dashboard", url: "/corporate-dashboard", icon: Target });
  }
  
  if (userRoles.includes('government_official')) {
    items.push({ title: "Government Dashboard", url: "/government-dashboard", icon: Building2 });
  }
  
  if (userRoles.includes('ngo_member')) {
    items.push({ title: "NGO Dashboard", url: "/ngo-dashboard", icon: Users });
  }
  
  if (isAdmin) {
    items.push({ title: "Admin Dashboard", url: "/admin-dashboard", icon: Shield });
    items.push({ title: "User Management", url: "/user-management", icon: Users });
  }
  
  return items;
};

const resourceItems = [
  { title: "Guidelines", url: "/guidelines", icon: BookOpen },
  { title: "Training", url: "/training", icon: Calendar },
  { title: "Resources", url: "/resources", icon: FileText },
  { title: "Connect", url: "/connect", icon: MapPin },
]

const supportItems = [
  { title: "Support", url: "/support", icon: HelpCircle },
  { title: "About", url: "/about", icon: Info },
  { title: "Contact", url: "/contact", icon: Phone },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { userRoles, isAdmin, user } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  const dashboardItems = getDashboardItems(userRoles, isAdmin);
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {analyticsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={getNavCls}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Submissions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {submissionItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={getNavCls}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {dashboardItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Dashboards</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {dashboardItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={getNavCls}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Resources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
