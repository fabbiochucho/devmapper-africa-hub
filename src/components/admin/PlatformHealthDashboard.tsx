import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, FileText, Building2, ShieldCheck, MessageSquare, 
  TrendingUp, DollarSign, Leaf, AlertTriangle, Activity 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ForumModeration from './ForumModeration';

interface PlatformStats {
  total_reports: number;
  reports_last_week: number;
  total_users: number;
  users_last_week: number;
  total_organizations: number;
  pending_verifications: number;
  forum_posts_last_week: number;
  total_funds_raised: number;
  esg_indicators_count: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function PlatformHealthDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [complianceAlerts, setComplianceAlerts] = useState<any[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch platform health stats
      const { data: reports } = await supabase.from('reports').select('id', { count: 'exact' });
      const { data: reportsWeek } = await supabase
        .from('reports')
        .select('id', { count: 'exact' })
        .gte('submitted_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      const { data: users } = await supabase.from('profiles').select('user_id', { count: 'exact' });
      const { data: usersWeek } = await supabase
        .from('profiles')
        .select('user_id', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      const { data: orgs } = await supabase.from('organizations').select('id', { count: 'exact' });
      const { data: pendingVerif } = await supabase
        .from('project_verifications')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');
      const { data: forumWeek } = await supabase
        .from('forum_posts')
        .select('id', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      const { data: campaigns } = await supabase
        .from('fundraising_campaigns')
        .select('raised_amount');
      const { data: esgIndicators } = await supabase.from('esg_indicators').select('id', { count: 'exact' });

      const totalFunds = campaigns?.reduce((sum, c) => sum + (c.raised_amount || 0), 0) || 0;

      setStats({
        total_reports: reports?.length || 0,
        reports_last_week: reportsWeek?.length || 0,
        total_users: users?.length || 0,
        users_last_week: usersWeek?.length || 0,
        total_organizations: orgs?.length || 0,
        pending_verifications: pendingVerif?.length || 0,
        forum_posts_last_week: forumWeek?.length || 0,
        total_funds_raised: totalFunds,
        esg_indicators_count: esgIndicators?.length || 0,
      });

      // Fetch role distribution
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('is_active', true);

      if (roles) {
        const roleCounts: Record<string, number> = {};
        roles.forEach((r) => {
          roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
        });
        setRoleDistribution(
          Object.entries(roleCounts).map(([name, value]) => ({ name, value }))
        );
      }

      // Fetch recent compliance alerts from audit logs
      const { data: alerts } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'compliance_flag')
        .order('created_at', { ascending: false })
        .limit(10);

      setComplianceAlerts(alerts || []);
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const weeklyGrowth = [
    { name: 'Reports', value: stats.reports_last_week },
    { name: 'Users', value: stats.users_last_week },
    { name: 'Forum Posts', value: stats.forum_posts_last_week },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Platform Health Dashboard</h2>
        <p className="text-muted-foreground">Real-time metrics and system health monitoring</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users.toLocaleString()}</div>
            <p className="text-xs text-green-500">+{stats.users_last_week} this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_reports.toLocaleString()}</div>
            <p className="text-xs text-green-500">+{stats.reports_last_week} this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_organizations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_verifications}</div>
            {stats.pending_verifications > 10 && (
              <Badge variant="destructive" className="text-xs mt-1">Needs attention</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funds Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total_funds_raised.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Alerts</TabsTrigger>
          <TabsTrigger value="moderation">Forum Moderation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weekly Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Weekly Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyGrowth}>
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Role Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {roleDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ESG Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                ESG Module Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{stats.esg_indicators_count}</p>
                  <p className="text-xs text-muted-foreground">ESG Indicators</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_organizations}</p>
                  <p className="text-xs text-muted-foreground">Orgs with ESG</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.forum_posts_last_week}</p>
                  <p className="text-xs text-muted-foreground">Forum Activity</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Recent Compliance Flags
              </CardTitle>
              <CardDescription>
                Automated compliance check results from weekly scans
              </CardDescription>
            </CardHeader>
            <CardContent>
              {complianceAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No compliance alerts. System is healthy!
                </p>
              ) : (
                <div className="space-y-2">
                  {complianceAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {(alert.payload as any)?.issue || 'Compliance Issue'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Org: {alert.org_id?.slice(0, 8)}... • {new Date(alert.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="destructive">Action Required</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="mt-4">
          <ForumModeration />
        </TabsContent>
      </Tabs>
    </div>
  );
}
