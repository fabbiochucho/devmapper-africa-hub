import { useUserRole } from "@/contexts/UserRoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, Building2, Target, Globe, TrendingUp, 
  BarChart3, Heart, UserCheck, MapPin, Award,
  Calendar, Briefcase, Shield
} from "lucide-react";

const UnifiedDashboard = () => {
  const { currentRole, roles, hasRole } = useUserRole();
  const { user, profile } = useAuth();

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
    const iconMap: Record<string, React.ComponentType> = {
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
      {/* Role Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getRoleIcon(currentRole)}
            {getRoleDisplayName(currentRole)} Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {roles.length}
              </div>
              <p className="text-muted-foreground">Active Roles</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {profile?.is_verified ? 'Verified' : 'Pending'}
              </div>
              <p className="text-muted-foreground">Account Status</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {profile?.country || 'Global'}
              </div>
              <p className="text-muted-foreground">Location</p>
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
            {/* Citizen Reporter Features */}
            {hasRole('citizen_reporter') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Citizen Reporter Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" asChild>
                    <a href="/submit-report">Submit New Report</a>
                  </Button>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">12</div>
                      <p className="text-sm text-muted-foreground">Reports Submitted</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">8</div>
                      <p className="text-sm text-muted-foreground">Verified</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Government Official Features */}
            {hasRole('government_official') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Government Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" asChild>
                    <a href="/government-dashboard">View Full Dashboard</a>
                  </Button>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">45</div>
                      <p className="text-sm text-muted-foreground">Projects</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">$2.4M</div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">23</div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Corporate Features */}
            {hasRole('company_representative') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Corporate ESG Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" asChild>
                    <a href="/corporate-dashboard">Manage ESG Targets</a>
                  </Button>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">7</div>
                      <p className="text-sm text-muted-foreground">Active Targets</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">64%</div>
                      <p className="text-sm text-muted-foreground">Avg Progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* NGO Features */}
            {hasRole('ngo_member') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    NGO Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" asChild>
                    <a href="/ngo-dashboard">View NGO Dashboard</a>
                  </Button>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">15</div>
                      <p className="text-sm text-muted-foreground">Active Programs</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">2.1K</div>
                      <p className="text-sm text-muted-foreground">Beneficiaries</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Change Maker Features */}
            {hasRole('change_maker') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Change Maker Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" asChild>
                    <a href="/submit-change-maker">Update Profile</a>
                  </Button>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">4.8</div>
                      <p className="text-sm text-muted-foreground">Rating</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">89</div>
                      <p className="text-sm text-muted-foreground">Connections</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Features */}
            {(hasRole('admin') || hasRole('platform_admin')) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Admin Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" asChild>
                      <a href="/admin-dashboard">Admin Dashboard</a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/user-management">User Management</a>
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">1.2K</div>
                      <p className="text-sm text-muted-foreground">Users</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">456</div>
                      <p className="text-sm text-muted-foreground">Reports</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">78</div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Your Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Analytics features coming soon</p>
                <Button className="mt-4" asChild>
                  <a href="/analytics">View Project Analytics</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline" asChild>
                  <a href="/submit-report">Submit Report</a>
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <a href="/fundraising">Browse Campaigns</a>
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <a href="/change-makers">Find Change Makers</a>
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <a href="/forum">Join Discussion</a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SDG Focus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline" asChild>
                  <a href="/sdg-agenda2063">SDG-Agenda 2063 Alignment</a>
                </Button>
                <div className="text-center py-4">
                  <Award className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Explore how your work aligns with global goals
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" variant="outline" asChild>
                <a href="/settings">Manage Profile & Preferences</a>
              </Button>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Current Roles</h4>
                <div className="flex flex-wrap gap-2">
                  {roles.map((roleData) => (
                    <Badge key={roleData.role} variant="secondary">
                      {getRoleDisplayName(roleData.role)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedDashboard;