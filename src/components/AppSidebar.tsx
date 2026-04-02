import { useState, useCallback } from "react";
import { 
  Home, Search, Users, Heart, Inbox, MessageSquare, 
  BarChart3, TrendingUp, FileText, UserPlus, Target, 
  Building2, Shield, BookOpen, Calendar, MapPin, Globe,
  HelpCircle, Info, Phone, Settings, Leaf, CreditCard,
  ChevronRight, ChevronDown, User, Briefcase, ListTodo, FileSpreadsheet,
  FolderOpen, Layers, ShoppingCart, Award
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { prefetchRoute } from "@/lib/route-prefetch";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, UserRole } from "@/contexts/UserRoleContext";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  citizen_reporter: { label: 'Citizen', color: 'bg-blue-500', icon: User },
  ngo_member: { label: 'NGO', color: 'bg-green-500', icon: Users },
  government_official: { label: 'Gov', color: 'bg-purple-500', icon: Building2 },
  company_representative: { label: 'Corporate', color: 'bg-amber-500', icon: Briefcase },
  country_admin: { label: 'Country Admin', color: 'bg-indigo-500', icon: Globe },
  platform_admin: { label: 'Platform Admin', color: 'bg-red-500', icon: Shield },
  change_maker: { label: 'Change Maker', color: 'bg-pink-500', icon: Heart },
  admin: { label: 'Admin', color: 'bg-red-600', icon: Shield },
};

// Core items - always visible, minimal
const coreItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Search", url: "/search", icon: Search },
];

// Get role-specific quick actions (most used)
const getQuickActions = (hasRole: (role: UserRole) => boolean, isAuth: boolean) => {
  const items = [];
  
  if (isAuth) {
    items.push({ title: "My Projects", url: "/my-projects", icon: Target });
    items.push({ title: "Submit Report", url: "/submit-report", icon: FileText });
  }
  
  if (hasRole('change_maker')) {
    items.push({ title: "My Analytics", url: "/my-analytics", icon: TrendingUp });
  }
  
  if (hasRole('company_representative')) {
    items.push({ title: "ESG Module", url: "/esg", icon: Leaf });
  }
  
  return items;
};

// Role-specific dashboard - show only the user's primary dashboard
const getPrimaryDashboard = (hasRole: (role: UserRole) => boolean) => {
  if (hasRole('admin') || hasRole('platform_admin')) {
    return [
      { title: "Admin Dashboard", url: "/admin-dashboard", icon: Shield },
      { title: "Admin CRM", url: "/admin-crm", icon: Settings },
      { title: "User Management", url: "/user-management", icon: Users },
    ];
  }
  if (hasRole('company_representative')) {
    return [
      { title: "Corporate Dashboard", url: "/corporate-dashboard", icon: Briefcase },
      { title: "Corporate Targets", url: "/corporate-targets", icon: Target },
    ];
  }
  if (hasRole('government_official')) {
    return [{ title: "Government Dashboard", url: "/government-dashboard", icon: Building2 }];
  }
  if (hasRole('ngo_member')) {
    return [{ title: "NGO Dashboard", url: "/ngo-dashboard", icon: Users }];
  }
  if (hasRole('change_maker')) {
    return [{ title: "Change Maker Profile", url: "/submit-change-maker", icon: Heart }];
  }
  return [];
};

// Collapsible resource groups
const resourceGroups = {
  carbon: {
    label: "Carbon & Marketplace",
    icon: Leaf,
    items: [
      { title: "Carbon Marketplace", url: "/carbon-marketplace", icon: ShoppingCart },
      { title: "Carbon Portfolio", url: "/carbon-portfolio", icon: Briefcase },
      { title: "Verifier Marketplace", url: "/verifier-marketplace", icon: Award },
    ]
  },
  learn: {
    label: "Learn & Train",
    icon: BookOpen,
    items: [
      { title: "Training", url: "/training", icon: Calendar },
      { title: "Guidelines", url: "/guidelines", icon: BookOpen },
      { title: "Resources", url: "/resources", icon: FileText },
    ]
  },
  sdg: {
    label: "SDG Framework",
    icon: Globe,
    items: [
      { title: "SDG Overview", url: "/sdg-overview", icon: Target },
      { title: "SDG-Agenda 2063", url: "/sdg-agenda2063", icon: Globe },
      { title: "SDG Indicators", url: "/sdg-indicators", icon: Target },
    ]
  },
  standards: {
    label: "Standards & Methods",
    icon: Shield,
    items: [
      { title: "Platform Overview", url: "/platform-overview", icon: Globe },
      { title: "Certification Workflow", url: "/certification-workflow", icon: Shield },
      { title: "SPVF Standards", url: "/spvf-standards", icon: Target },
      { title: "DSPM Methodology", url: "/dspm-methodology", icon: BookOpen },
    ]
  },
  connect: {
    label: "Connect & Support",
    icon: Phone,
    items: [
      { title: "Connect", url: "/connect", icon: MapPin },
      { title: "Support", url: "/support", icon: HelpCircle },
      { title: "About", url: "/about", icon: Info },
      { title: "Contact", url: "/contact", icon: Phone },
    ]
  }
};

// Submission items - only for authenticated users
const getSubmissionItems = (hasRole: (role: UserRole) => boolean) => {
  const items = [
    { title: "Submit Report", url: "/submit-report", icon: FileText },
    { title: "My Projects", url: "/my-projects", icon: Target },
    { title: "Project Management", url: "/project-management", icon: ListTodo },
  ];
  
  if (hasRole('admin') || hasRole('platform_admin') || hasRole('ngo_member')) {
    items.push({ title: "Bulk Upload", url: "/bulk-upload", icon: FileSpreadsheet });
  }
  
  items.push({ title: "Apply for Certification", url: "/apply-certification", icon: Shield });
  
  return items;
};

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const { hasRole, isAuthenticated, currentRole, roles } = useUserRole();
  const currentPath = location.pathname;

  const collapsed = state === "collapsed";
  
  // Track which resource groups are open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" : "hover:bg-muted/50";

  // Prefetch on hover for instant navigation
  const handlePrefetch = useCallback((url: string) => () => prefetchRoute(url), []);

  const quickActions = getQuickActions(hasRole, isAuthenticated);
  const primaryDashboard = getPrimaryDashboard(hasRole);
  const submissionItems = getSubmissionItems(hasRole);
  const currentRoleConfig = roleConfig[currentRole] || roleConfig.citizen_reporter;
  const RoleIcon = currentRoleConfig.icon;
  const isAdmin = hasRole('admin') || hasRole('platform_admin');

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Role Indicator */}
        {isAuthenticated && !collapsed && (
          <div className="px-3 py-2 border-b">
            <Badge className={`${currentRoleConfig.color} text-white text-xs`}>
              <RoleIcon className="h-3 w-3 mr-1" />
              {currentRoleConfig.label}
            </Badge>
          </div>
        )}

        {/* Core Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {coreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"} 
                      className={getNavCls}
                      onMouseEnter={handlePrefetch(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* Community always visible */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/change-makers" className={getNavCls}>
                    <Users className="h-4 w-4" />
                    {!collapsed && <span className="ml-2">Change Makers</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/fundraising" className={getNavCls}>
                    <Heart className="h-4 w-4" />
                    {!collapsed && <span className="ml-2">Fundraising</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAuthenticated && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/messages" className={getNavCls}>
                        <Inbox className="h-4 w-4" />
                        {!collapsed && <span className="ml-2">Messages</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/forum" className={getNavCls}>
                        <MessageSquare className="h-4 w-4" />
                        {!collapsed && <span className="ml-2">Forum</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Primary Dashboard - Role-specific */}
        {primaryDashboard.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <ChevronRight className="h-3 w-3 mr-1" />
              Dashboard
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {primaryDashboard.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls} onMouseEnter={handlePrefetch(item.url)}>
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

        {/* Projects & Submissions - Only for authenticated */}
        {isAuthenticated && (
          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {submissionItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls} onMouseEnter={handlePrefetch(item.url)}>
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

        {/* Analytics - Simplified */}
        {isAuthenticated && (
          <SidebarGroup>
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/analytics" className={getNavCls}>
                      <BarChart3 className="h-4 w-4" />
                      {!collapsed && <span className="ml-2">SDG Analytics</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/project-analytics" className={getNavCls}>
                      <TrendingUp className="h-4 w-4" />
                      {!collapsed && <span className="ml-2">Project Analytics</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {(hasRole('company_representative') || isAdmin) && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/advanced-analytics" className={getNavCls}>
                        <Layers className="h-4 w-4" />
                        {!collapsed && <span className="ml-2">Advanced</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Resources - Collapsible Groups */}
        <SidebarGroup>
          <SidebarGroupLabel>Resources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.entries(resourceGroups).map(([key, group]) => (
                <Collapsible
                  key={key}
                  open={openGroups[key]}
                  onOpenChange={() => toggleGroup(key)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full justify-between hover:bg-muted/50">
                        <span className="flex items-center">
                          <group.icon className="h-4 w-4" />
                          {!collapsed && <span className="ml-2">{group.label}</span>}
                        </span>
                        {!collapsed && (
                          openGroups[key] ? 
                            <ChevronDown className="h-3 w-3" /> : 
                            <ChevronRight className="h-3 w-3" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenu className="pl-4 mt-1 border-l ml-2">
                        {group.items.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                              <NavLink to={item.url} className={getNavCls}>
                                <item.icon className="h-3 w-3" />
                                {!collapsed && <span className="ml-2 text-sm">{item.title}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pricing - Always visible */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/pricing" className={getNavCls}>
                    <CreditCard className="h-4 w-4" />
                    {!collapsed && <span className="ml-2">Pricing</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
          {isAuthenticated && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/billing-upgrade" className={getNavCls}>
                  <CreditCard className="h-4 w-4" />
                  {!collapsed && <span className="ml-2">Billing</span>}
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
