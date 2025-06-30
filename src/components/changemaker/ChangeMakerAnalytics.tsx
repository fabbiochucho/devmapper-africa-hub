
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Users, Target, DollarSign, TrendingUp } from "lucide-react";
import { ChangeMaker } from "@/data/mockChangeMakers";
import { sdgGoals } from "@/lib/constants";

interface ChangeMakerAnalyticsProps {
  changeMakers: ChangeMaker[];
}

const ChangeMakerAnalytics: React.FC<ChangeMakerAnalyticsProps> = ({ changeMakers }) => {
  // Calculate statistics
  const totalChangeMakers = changeMakers.length;
  const totalFunding = changeMakers.reduce((sum, cm) => sum + cm.totalFunding, 0);
  const totalLivesTouched = changeMakers.reduce((sum, cm) => sum + cm.impactMetrics.livesTouched, 0);
  const totalProjects = changeMakers.reduce((sum, cm) => sum + cm.impactMetrics.projectsCompleted, 0);

  // Change Makers by Type
  const typeData = [
    { name: 'Individual', count: changeMakers.filter(cm => cm.type === 'individual').length },
    { name: 'Group', count: changeMakers.filter(cm => cm.type === 'group').length },
    { name: 'NGO', count: changeMakers.filter(cm => cm.type === 'ngo').length },
    { name: 'Corporate', count: changeMakers.filter(cm => cm.type === 'corporate').length },
  ];

  // SDG Distribution
  const sdgCounts: { [key: string]: number } = {};
  changeMakers.forEach(cm => {
    cm.sdg_goals.forEach(sdg => {
      sdgCounts[sdg] = (sdgCounts[sdg] || 0) + 1;
    });
  });

  const sdgData = Object.entries(sdgCounts).map(([sdg, count]) => ({
    sdg: `SDG ${sdg}`,
    count,
    name: sdgGoals.find(g => g.number.toString() === sdg)?.title || `SDG ${sdg}`
  })).sort((a, b) => b.count - a.count);

  // Country Distribution
  const countryData = changeMakers.reduce((acc: { [key: string]: number }, cm) => {
    const country = cm.location.split(', ').pop() || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});

  const countryChartData = Object.entries(countryData).map(([country, count]) => ({
    country,
    count
  }));

  // Funding by Type
  const fundingByType = [
    { type: 'Individual', funding: changeMakers.filter(cm => cm.type === 'individual').reduce((sum, cm) => sum + cm.totalFunding, 0) },
    { type: 'Group', funding: changeMakers.filter(cm => cm.type === 'group').reduce((sum, cm) => sum + cm.totalFunding, 0) },
    { type: 'NGO', funding: changeMakers.filter(cm => cm.type === 'ngo').reduce((sum, cm) => sum + cm.totalFunding, 0) },
    { type: 'Corporate', funding: changeMakers.filter(cm => cm.type === 'corporate').reduce((sum, cm) => sum + cm.totalFunding, 0) },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

  const formatCurrency = (value: number) => `$${(value / 1000).toFixed(0)}K`;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Change Makers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChangeMakers}</div>
            <p className="text-xs text-muted-foreground">Active across Africa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalFunding / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">Mobilized for projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lives Touched</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalLivesTouched / 1000).toFixed(0)}K+</div>
            <p className="text-xs text-muted-foreground">People impacted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Successful implementations</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Makers by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Change Makers by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funding by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Funding by Change Maker Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fundingByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Funding']} />
                <Bar dataKey="funding" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SDG Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>SDG Focus Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sdgData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sdg" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Country Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Change Makers by Country</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChangeMakerAnalytics;
