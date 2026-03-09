import { useState, useEffect } from "react";
import { useUserRole, UserRole } from "@/contexts/UserRoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Building2, Target, Globe, TrendingUp,
  BarChart3, Heart, UserCheck, Award,
  Calendar, Briefcase, Shield, Clock
} from "lucide-react";
import ProductWalkthrough from "@/components/onboarding/ProductWalkthrough";
import ProfileCompletionPrompt from "@/components/onboarding/ProfileCompletionPrompt";

interface DashboardStats {
  userReports: number;
  userVerifications: number;  
  totalProjects: number;
  totalFunding: number;
}

const UnifiedDashboard = () => {
  const { currentRole, roles, hasRole, setCurrentRole } = useUserRole();
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    userReports: 0,
    userVerifications: 0,
    totalProjects: 0,
    totalFunding: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user?.id) return;
      
      try {
        // Batch all queries in parallel & use count-only where possible
        const [reportsResult, verificationsResult, totalProjectsResult, fundingResult] = await Promise.all([
          supabase
            .from('reports')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('verification_logs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('reports')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('reports')
            .select('cost')
            .not('cost', 'is', null),
        ]);

        if (reportsResult.error) throw reportsResult.error;
        if (verificationsResult.error) throw verificationsResult.error;

        const totalProjects = totalProjectsResult.count || 0;
        const totalFunding = fundingResult.data?.reduce((sum, r) => sum + (Number(r.cost) || 0), 0) || 0;

        setStats({
          userReports: reportsResult.count || 0,
          userVerifications: verificationsResult.count || 0,
          totalProjects,
          totalFunding
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to access your dashboard</p>
          <Button asChild>
            <a href="/auth">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  const getFirstName = (fullName: string | null) => {
    if (!fullName) return 'there';
    return fullName.split(' ')[0];
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'citizen_reporter': 'Citizen Reporter',
      'ngo_member': 'NGO Member',
      'government_official': 'Government Official',
      'company_representative': 'Company Representative',
      'country_admin': 'Country Admin',
      'platform_admin': 'Platform Admin',
      'change_maker': 'Change Maker',
      'admin': 'Administrator'
    };
    return roleMap[role] || role;
  };

  const getRoleIcon = (role: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'citizen_reporter': Users,
      'ngo_member': Heart,
      'government_official': Building2,
      'company_representative': Briefcase,
      'country_admin': Globe,
      'platform_admin': Shield,
      'change_maker': UserCheck,
      'admin': Shield
    };
    const Icon = iconMap[role] || Users;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header with Role Switcher on same line */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2">
              {getRoleIcon(currentRole)}
              Welcome back, {getFirstName(profile?.full_name)}!
            </CardTitle>
            {roles.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Switch role:</span>
                <Select value={currentRole} onValueChange={(val) => setCurrentRole(val as UserRole)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((roleData) => (
                      <SelectItem key={roleData.role} value={roleData.role}>
                        {getRoleDisplayName(roleData.role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{roles.length}</div>
              <p className="text-muted-foreground text-sm">Active Roles</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {profile?.is_verified ? 'Verified' : 'Pending'}
              </div>
              <p className="text-muted-foreground text-sm">Account Status</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {profile?.country || 'Global'}
              </div>
              <p className="text-muted-foreground text-sm">Location</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {getRoleDisplayName(currentRole)}
              </div>
              <p className="text-muted-foreground text-sm">Current Role</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-Specific Dashboards */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4">
            {/* Personal Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Your Impact</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div><div className="text-lg font-semibold animate-pulse">--</div><p className="text-sm text-muted-foreground">Loading...</p></div>
                    <div><div className="text-lg font-semibold animate-pulse">--</div><p className="text-sm text-muted-foreground">Loading...</p></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div><div className="text-lg font-semibold text-green-600">{stats.userReports}</div><p className="text-sm text-muted-foreground">Reports Submitted</p></div>
                    <div><div className="text-lg font-semibold text-blue-600">{stats.userVerifications}</div><p className="text-sm text-muted-foreground">Verifications Made</p></div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role-specific features - same as before */}
            {hasRole('citizen_reporter') && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Citizen Reporter</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" asChild><a href="/submit-report">Submit New Report</a></Button>
                  <Button variant="outline" className="w-full" asChild><a href="/analytics?tab=reports">View Your Reports</a></Button>
                </CardContent>
              </Card>
            )}

            {hasRole('government_official') && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Government Dashboard</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" asChild><a href="/government-dashboard">View Full Dashboard</a></Button>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div><div className="text-lg font-semibold text-blue-600">{stats.totalProjects}</div><p className="text-sm text-muted-foreground">Total Projects</p></div>
                    <div><div className="text-lg font-semibold text-green-600">${(stats.totalFunding / 1000000).toFixed(1)}M</div><p className="text-sm text-muted-foreground">Total Funding</p></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {hasRole('company_representative') && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Corporate ESG Dashboard</CardTitle></CardHeader>
                <CardContent className="space-y-4"><Button className="w-full" asChild><a href="/corporate-dashboard">Manage ESG Targets</a></Button></CardContent>
              </Card>
            )}

            {hasRole('ngo_member') && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5" />NGO Dashboard</CardTitle></CardHeader>
                <CardContent className="space-y-4"><Button className="w-full" asChild><a href="/ngo-dashboard">View NGO Dashboard</a></Button></CardContent>
              </Card>
            )}

            {hasRole('change_maker') && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5" />Change Maker Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4"><Button className="w-full" asChild><a href="/submit-change-maker">Update Profile</a></Button></CardContent>
              </Card>
            )}

            {(hasRole('admin') || hasRole('platform_admin')) && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Admin Controls</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" asChild><a href="/admin-dashboard">Admin Dashboard</a></Button>
                    <Button variant="outline" asChild><a href="/user-management">User Management</a></Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader><CardTitle>Analytics & Insights</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" asChild><a href="/analytics">View Full Analytics Dashboard</a></Button>
              <Button variant="outline" className="w-full" asChild><a href="/sdg-agenda2063">SDG-Agenda 2063 Alignment</a></Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline" asChild><a href="/submit-report">Submit Report</a></Button>
                <Button className="w-full" variant="outline" asChild><a href="/fundraising">Browse Campaigns</a></Button>
                <Button className="w-full" variant="outline" asChild><a href="/change-makers">Find Change Makers</a></Button>
                <Button className="w-full" variant="outline" asChild><a href="/forum">Join Discussion</a></Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Community</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline" asChild><a href="/messages">Messages</a></Button>
                <Button className="w-full" variant="outline" asChild><a href="/connect">Connect & Share</a></Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle>Account Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" variant="outline" asChild><a href="/settings">Manage Profile & Preferences</a></Button>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Current Roles</h4>
                <div className="flex flex-wrap gap-2">
                  {roles.map((roleData) => (
                    <Badge key={roleData.role} variant="secondary">{getRoleDisplayName(roleData.role)}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <ProductWalkthrough />
      <ProfileCompletionPrompt />
    </div>
  );
};

export default UnifiedDashboard;
