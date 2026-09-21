
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Target, DollarSign, CheckCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { sdgGoals } from "@/lib/constants";

type ChangeMaker = Database['public']['Tables']['change_makers']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];
type Campaign = Database['public']['Tables']['fundraising_campaigns']['Row'];

interface ChangeMakerAnalyticsProps {
  changeMakers: ChangeMaker[];
  // Funding/project totals are derived from real reports and fundraising
  // campaigns (same join pattern as ChangeMakerMyAnalytics), not from the
  // admin-editable total_funding/projects_count columns on change_makers.
  reports: Report[];
  campaigns: Campaign[];
}

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

const ChangeMakerAnalytics: React.FC<ChangeMakerAnalyticsProps> = ({ changeMakers, reports, campaigns }) => {
  const totalChangeMakers = changeMakers.length;
  const verifiedCount = changeMakers.filter(cm => cm.is_verified).length;
  const totalFunding = campaigns.reduce((sum, c) => sum + (c.raised_amount || 0), 0);
  const totalProjects = reports.length;

  // The mock "type" breakdown (individual/group/ngo/corporate) has no real
  // column on change_makers, so it's replaced with the one real status the
  // schema actually tracks: verification.
  const verificationData = [
    { name: 'Verified', count: verifiedCount },
    { name: 'Unverified', count: Math.max(0, totalChangeMakers - verifiedCount) },
  ];

  // SDG distribution -- sdg_goals is a real integer[] column.
  const sdgCounts: Record<number, number> = {};
  changeMakers.forEach(cm => {
    (cm.sdg_goals || []).forEach(sdg => {
      sdgCounts[sdg] = (sdgCounts[sdg] || 0) + 1;
    });
  });
  const sdgData = Object.entries(sdgCounts)
    .map(([sdg, count]) => ({
      sdg: `SDG ${sdg}`,
      count,
      name: sdgGoals.find(g => g.number === Number(sdg))?.title || `SDG ${sdg}`,
    }))
    .sort((a, b) => b.count - a.count);

  // Country distribution -- real country_code column.
  const countryCounts: Record<string, number> = {};
  changeMakers.forEach(cm => {
    const country = cm.country_code || 'Unknown';
    countryCounts[country] = (countryCounts[country] || 0) + 1;
  });
  const countryChartData = Object.entries(countryCounts).map(([country, count]) => ({ country, count }));

  // Funding by country: attribute each campaign's raised amount to its
  // creator's change-maker country via user_id.
  const countryByUserId: Record<string, string> = {};
  changeMakers.forEach(cm => {
    if (cm.user_id) countryByUserId[cm.user_id] = cm.country_code || 'Unknown';
  });
  const fundingByCountry: Record<string, number> = {};
  campaigns.forEach(c => {
    const country = countryByUserId[c.created_by] || 'Unknown';
    fundingByCountry[country] = (fundingByCountry[country] || 0) + (c.raised_amount || 0);
  });
  const fundingByCountryData = Object.entries(fundingByCountry).map(([country, funding]) => ({ country, funding }));

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
            <p className="text-xs text-muted-foreground">Registered across Africa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedCount}</div>
            <p className="text-xs text-muted-foreground">Verified change makers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funding Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalFunding / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-muted-foreground">Via fundraising campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Reported</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Submitted reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            {totalChangeMakers > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={verificationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="count"
                  >
                    {verificationData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">No change makers yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funding by Country</CardTitle>
          </CardHeader>
          <CardContent>
            {fundingByCountryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={fundingByCountryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Funding']} />
                  <Bar dataKey="funding" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">No funding data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SDG Focus Areas</CardTitle>
          </CardHeader>
          <CardContent>
            {sdgData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sdgData.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sdg" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">No SDG data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Makers by Country</CardTitle>
          </CardHeader>
          <CardContent>
            {countryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={countryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">No location data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChangeMakerAnalytics;
