import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AnalyticsData {
  totalProjects: number;
  totalFunding: number;
  totalChangeMakers: number;
  verifiedProjects: number;
  countriesData: Array<{ country: string; count: number }>;
  sdgData: Array<{ goal: string; count: number }>;
  statusData: Array<{ status: string, count: number, color: string }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export default function RealTimeAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalProjects: 0,
    totalFunding: 0,
    totalChangeMakers: 0,
    verifiedProjects: 0,
    countriesData: [],
    sdgData: [],
    statusData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch reports data
        const { data: reports, error: reportsError } = await supabase
          .from('reports')
          .select('*');

        if (reportsError) throw reportsError;

        // Fetch change makers data
        const { data: changeMakers, error: changeMakersError } = await supabase
          .from('change_makers')
          .select('*');

        if (changeMakersError) throw changeMakersError;

        // Process data for analytics
        const totalProjects = reports?.length || 0;
        const totalFunding = reports?.reduce((sum, r) => sum + (Number(r.cost) || 0), 0) || 0;
        const totalChangeMakers = changeMakers?.length || 0;
        const verifiedProjects = reports?.filter(r => r.is_verified).length || 0;

        // Countries data
        const countryMap = new Map();
        reports?.forEach(report => {
          if (report.country_code) {
            countryMap.set(report.country_code, (countryMap.get(report.country_code) || 0) + 1);
          }
        });
        const countriesData = Array.from(countryMap.entries())
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // SDG data
        const sdgMap = new Map();
        reports?.forEach(report => {
          const goal = `SDG ${report.sdg_goal}`;
          sdgMap.set(goal, (sdgMap.get(goal) || 0) + 1);
        });
        const sdgData = Array.from(sdgMap.entries())
          .map(([goal, count]) => ({ goal, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Status data
        const statusMap = new Map();
        const statusColors: Record<string, string> = {
          'planned': '#ffc658',
          'in_progress': '#8884d8', 
          'completed': '#82ca9d',
          'stalled': '#ff7300',
          'cancelled': '#ff4444'
        };
        
        reports?.forEach(report => {
          const status = report.project_status;
          statusMap.set(status, (statusMap.get(status) || 0) + 1);
        });
        const statusData = Array.from(statusMap.entries())
          .map(([status, count]) => ({ 
            status: status.replace('_', ' '), 
            count, 
            color: statusColors[status] || '#888888' 
          }));

        setAnalytics({
          totalProjects,
          totalFunding,
          totalChangeMakers,
          verifiedProjects,
          countriesData,
          sdgData,
          statusData
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    // Set up real-time subscription
    const subscription = supabase
      .channel('analytics_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'reports' 
      }, () => {
        fetchAnalytics();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'change_makers' 
      }, () => {
        fetchAnalytics();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold animate-pulse">---</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.verifiedProjects} verified
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(analytics.totalFunding / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Change Makers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalChangeMakers}</div>
            <p className="text-xs text-muted-foreground">
              Active community leaders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalProjects > 0 ? Math.round((analytics.verifiedProjects / analytics.totalProjects) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Projects verified
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Projects by Country</CardTitle>
            <CardDescription>Top 5 countries with most projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.countriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SDG Goals Distribution</CardTitle>
            <CardDescription>Most targeted SDG goals</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.sdgData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="goal" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
            <CardDescription>Current status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}