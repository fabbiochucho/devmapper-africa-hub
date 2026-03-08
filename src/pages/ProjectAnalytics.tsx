import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMyProjects } from '@/hooks/useMyProjects';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { sdgGoals, sdgGoalColors } from '@/lib/constants';
import { Target, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const ProjectAnalytics = () => {
  const { projects, loading } = useMyProjects();
  const { user, userRoles } = useAuth();
  const navigate = useNavigate();

  const analytics = useMemo(() => {
    if (!projects.length) return null;

    // Status distribution
    const statusCounts: Record<string, number> = {};
    projects.forEach(p => {
      statusCounts[p.project_status] = (statusCounts[p.project_status] || 0) + 1;
    });
    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
    }));

    // SDG distribution
    const sdgCounts: Record<number, number> = {};
    projects.forEach(p => {
      sdgCounts[p.sdg_goal] = (sdgCounts[p.sdg_goal] || 0) + 1;
    });
    const sdgData = Object.entries(sdgCounts)
      .map(([goal, count]) => ({
        name: `SDG ${goal}`,
        goal: parseInt(goal),
        count,
      }))
      .sort((a, b) => a.goal - b.goal);

    // Total cost by status
    const costByStatus: Record<string, number> = {};
    projects.forEach(p => {
      if (p.cost) {
        costByStatus[p.project_status] = (costByStatus[p.project_status] || 0) + p.cost;
      }
    });
    const costData = Object.entries(costByStatus).map(([status, total]) => ({
      name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: total,
    }));

    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.project_status === 'completed').length;
    const verifiedProjects = projects.filter(p => p.is_verified).length;
    const totalCost = projects.reduce((s, p) => s + (p.cost || 0), 0);
    const totalBeneficiaries = projects.reduce((s, p) => s + (p.beneficiaries || 0), 0);

    return { statusData, sdgData, costData, totalProjects, completedProjects, verifiedProjects, totalCost, totalBeneficiaries };
  }, [projects]);

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
        <Button onClick={() => navigate('/auth')}>Sign In</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center">
        <Target className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">No Project Data</h2>
        <p className="text-muted-foreground mt-2">Submit your first report to see analytics.</p>
        <Button className="mt-4" onClick={() => navigate('/submit-report')}>Submit Report</Button>
      </div>
    );
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const roleLabel = userRoles.includes('company_representative') ? 'Corporate ESG/CSR'
    : userRoles.includes('ngo_member') ? 'NGO Impact'
    : userRoles.includes('government_official') ? 'Government'
    : userRoles.includes('change_maker') ? 'Change Maker'
    : 'Project';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{roleLabel} Analytics</h1>
        <p className="text-muted-foreground">Impact overview across all your projects and affiliations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Projects</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{analytics.totalProjects}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary">{analytics.completedProjects}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Verified</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{analytics.verifiedProjects}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Investment</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${analytics.totalCost.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Beneficiaries</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{analytics.totalBeneficiaries.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Projects by SDG Goal</CardTitle>
            <CardDescription>Distribution across Sustainable Development Goals</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.sdgData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
                <Pie data={analytics.statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {analytics.statusData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {analytics.costData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Investment by Status</CardTitle>
              <CardDescription>Total project cost distributed by current status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.costData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Investment']} />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProjectAnalytics;
