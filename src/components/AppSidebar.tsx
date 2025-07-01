
import { Calendar, Home, Inbox, Search, Settings, Users, BarChart3, Target, Building2, Shield, MessageSquare, BookOpen, HelpCircle, FileText, Phone, Info, Heart, UserPlus, MapPin, TrendingUp } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

const dashboardItems = [
  { title: "Corporate Targets", url: "/corporate-targets", icon: Target },
  { title: "Government Dashboard", url: "/government-dashboard", icon: Building2 },
  { title: "Admin Dashboard", url: "/admin-dashboard", icon: Shield },
  { title: "User Management", url: "/user-management", icon: Users },
]

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
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Submissions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {submissionItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Dashboards</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Resources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
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
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
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
