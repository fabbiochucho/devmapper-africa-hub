import { 
  Home, Search, Users, Heart, Inbox, MessageSquare, 
  BarChart3, TrendingUp, FileText, UserPlus, Target, 
  Building2, Shield, BookOpen, Calendar, MapPin, Globe,
  HelpCircle, Info, Phone, Settings, Leaf, CreditCard,
  ChevronRight, User, Briefcase, ListTodo, FileSpreadsheet
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, UserRole } from "@/contexts/UserRoleContext";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

// Role display names and colors
const roleConfig: Record<UserRole, { label: string; color: string; icon: any }> = {
  citizen_reporter: { label: 'Citizen Reporter', color: 'bg-blue-500', icon: User },
  ngo_member: { label: 'NGO Member', color: 'bg-green-500', icon: Users },
  government_official: { label: 'Government Official', color: 'bg-purple-500', icon: Building2 },
  company_representative: { label: 'Corporate Rep', color: 'bg-amber-500', icon: Briefcase },
  country_admin: { label: 'Country Admin', color: 'bg-indigo-500', icon: Globe },
  platform_admin: { label: 'Platform Admin', color: 'bg-red-500', icon: Shield },
  change_maker: { label: 'Change Maker', color: 'bg-pink-500', icon: Heart },
  admin: { label: 'Admin', color: 'bg-red-600', icon: Shield },
};

// Base items visible to everyone
const publicItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Search", url: "/search", icon: Search },
  { title: "Change Makers", url: "/change-makers", icon: Users },
  { title: "Fundraising", url: "/fundraising", icon: Heart },
];

// Items for authenticated users
const authItems = [
  { title: "Messages", url: "/messages", icon: Inbox },
  { title: "Forum", url: "/forum", icon: MessageSquare },
];

// Analytics - role-based visibility
const getAnalyticsItems = (hasRole: (role: UserRole) => boolean) => {
  const items = [
    { title: "SDG Analytics", url: "/analytics", icon: BarChart3 },
  ];
  
  if (hasRole('change_maker') || hasRole('admin') || hasRole('platform_admin')) {
    items.push({ title: "Change Maker Analytics", url: "/change-maker-analytics", icon: TrendingUp });
    items.push({ title: "My Analytics", url: "/my-analytics", icon: User });
  }
  
  if (hasRole('company_representative') || hasRole('admin') || hasRole('platform_admin')) {
    items.push({ title: "Advanced Analytics", url: "/advanced-analytics", icon: BarChart3 });
  }
  
  return items;
};

// Submission items
const submissionItems = [
  { title: "Submit Report", url: "/submit-report", icon: FileText },
  { title: "Bulk Upload", url: "/bulk-upload", icon: FileSpreadsheet },
  { title: "My Projects", url: "/my-projects", icon: Target },
  { title: "Project Management", url: "/project-management", icon: ListTodo },
  { title: "Project Analytics", url: "/project-analytics", icon: TrendingUp },
  { title: "Submit Change Maker", url: "/submit-change-maker", icon: UserPlus },
];

// Role-specific dashboard items
const getDashboardItems = (hasRole: (role: UserRole) => boolean, currentRole: UserRole) => {
  const items = [];
  
  if (hasRole('company_representative')) {
    items.push({ title: "Corporate Dashboard", url: "/corporate-dashboard", icon: Target });
    items.push({ title: "Corporate Targets", url: "/corporate-targets", icon: Target });
    items.push({ title: "ESG Module", url: "/esg", icon: Leaf });
  }
  
  if (hasRole('government_official')) {
    items.push({ title: "Government Dashboard", url: "/government-dashboard", icon: Building2 });
  }
  
  if (hasRole('ngo_member')) {
    items.push({ title: "NGO Dashboard", url: "/ngo-dashboard", icon: Users });
  }
  
  if (hasRole('change_maker')) {
    items.push({ title: "Change Maker Profile", url: "/submit-change-maker", icon: Heart });
    items.push({ title: "Fundraising", url: "/fundraising", icon: Heart });
    items.push({ title: "Impact Analytics", url: "/change-maker-analytics", icon: TrendingUp });
  }
  
  if (hasRole('admin') || hasRole('platform_admin')) {
    items.push({ title: "Admin Dashboard", url: "/admin-dashboard", icon: Shield });
    items.push({ title: "User Management", url: "/user-management", icon: Users });
    items.push({ title: "ESG Module", url: "/esg", icon: Leaf });
  }
  
  return items;
};

// Resource items - contextual based on role
const getResourceItems = (hasRole: (role: UserRole) => boolean) => {
  const items = [
    { title: "Guidelines", url: "/guidelines", icon: BookOpen },
    { title: "SDG Overview", url: "/sdg-overview", icon: Target },
    { title: "SDG-Agenda 2063", url: "/sdg-agenda2063", icon: Globe },
    { title: "DSPM Methodology", url: "/dspm-methodology", icon: BookOpen },
    { title: "SPVF Standards", url: "/spvf-standards", icon: Target },
  ];
  
  // Training more relevant for certain roles
  if (hasRole('ngo_member') || hasRole('government_official') || hasRole('admin')) {
    items.push({ title: "Training", url: "/training", icon: Calendar });
  }
  
  items.push({ title: "Resources", url: "/resources", icon: FileText });
  items.push({ title: "Connect", url: "/connect", icon: MapPin });
  
  return items;
};

// Support items
const supportItems = [
  { title: "Pricing", url: "/pricing", icon: CreditCard },
  { title: "Support", url: "/support", icon: HelpCircle },
  { title: "About", url: "/about", icon: Info },
  { title: "Contact", url: "/contact", icon: Phone },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const { hasRole, isAuthenticated, currentRole, roles } = useUserRole();
  const currentPath = location.pathname;

  const collapsed = state === "collapsed";

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" : "hover:bg-muted/50";

  const dashboardItems = getDashboardItems(hasRole, currentRole);
  const analyticsItems = getAnalyticsItems(hasRole);
  const resourceItems = getResourceItems(hasRole);

  const currentRoleConfig = roleConfig[currentRole] || roleConfig.citizen_reporter;
  const RoleIcon = currentRoleConfig.icon;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Role Indicator - Only show when authenticated */}
        {isAuthenticated && !collapsed && (
          <div className="px-3 py-2 border-b">
            <div className="flex items-center gap-2">
              <Badge className={`${currentRoleConfig.color} text-white text-xs`}>
                <RoleIcon className="h-3 w-3 mr-1" />
                {currentRoleConfig.label}
              </Badge>
            </div>
            {roles.length > 1 && (
              <p className="text-[10px] text-muted-foreground mt-1">
                +{roles.length - 1} more role{roles.length > 2 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {publicItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAuthenticated && authItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Dashboards - Role-specific */}
        {dashboardItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <ChevronRight className="h-3 w-3 mr-1" />
              Your Dashboards
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {dashboardItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="ml-2">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Analytics */}
        {isAuthenticated && (
          <SidebarGroup>
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {analyticsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="ml-2">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Submissions */}
        {isAuthenticated && (
          <SidebarGroup>
            <SidebarGroupLabel>Submissions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {submissionItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="ml-2">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Resources */}
        <SidebarGroup>
          <SidebarGroupLabel>Resources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Support */}
        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Settings & Billing */}
      <SidebarFooter>
        <SidebarMenu>
          {isAuthenticated && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/billing-upgrade" className={getNavCls}>
                  <CreditCard className="h-4 w-4" />
                  {!collapsed && <span className="ml-2">Billing & Plans</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/settings" className={getNavCls}>
                <Settings className="h-4 w-4" />
                {!collapsed && <span className="ml-2">Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
