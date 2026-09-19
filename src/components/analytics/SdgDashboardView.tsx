import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Globe,
  Users,
  Download,
  Filter,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { africanCountries } from "@/data/countries";
import { sdgGoals } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SdgIcon from "@/components/landing/SdgIcon";

interface CountryStat {
  country: string;
  projects: number;
  budget: number;
}

interface AnalyticsData {
  totalProjects: number;
  confirmedProjects: number;
  totalBudget: number;
  countriesActive: number;
  sdgDistribution: { goal: number; count: number; percentage: number }[];
  countryStats: CountryStat[];
  countryStatsByBudget: CountryStat[];
  monthlyTrends: { month: string; projects: number; budget: number }[];
  verificationStats: { verified: number; pending: number };
}

const countryCodeMap = new Map(africanCountries.map((c) => [c.name, c.code]));
const codeToNameMap = new Map(africanCountries.map((c) => [c.code, c.name]));
const sdgGoalMap = new Map(sdgGoals.map(g => [g.value, g.label]));

const TIMEFRAME_MONTHS: Record<string, number | null> = {
  '1month': 1,
  '3months': 3,
  '6months': 6,
  '1year': 12,
  'all': null,
};

const SdgDashboardView = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("6months");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, selectedTimeframe]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('reports')
        .select('sdg_goal, country_code, cost, is_verified, project_status, submitted_at');

      if (selectedCountry !== 'all') {
        query = query.eq('country_code', selectedCountry);
      }
      const months = TIMEFRAME_MONTHS[selectedTimeframe];
      if (months !== null) {
        const since = new Date();
        since.setMonth(since.getMonth() - months);
        query = query.gte('submitted_at', since.toISOString());
      }

      const { data: reports, error } = await query;
      if (error) throw error;

      setAnalytics(computeAnalytics(reports || []));
    } catch (error) {
      console.error('Error fetching SDG analytics:', error);
      setAnalytics(computeAnalytics([]));
    } finally {
      setIsLoading(false);
    }
  };

  const computeAnalytics = (
    rows: { sdg_goal: number | null; country_code: string | null; cost: number | null; is_verified: boolean | null; project_status: string | null; submitted_at: string | null }[]
  ): AnalyticsData => {
    const totalProjects = rows.length;
    const confirmedProjects = rows.filter(r => r.is_verified).length;
    const totalBudget = rows.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
    const countriesActive = new Set(rows.map(r => r.country_code).filter(Boolean)).size;

    const sdgCounts = new Map<number, number>();
    rows.forEach(r => {
      if (r.sdg_goal != null) sdgCounts.set(r.sdg_goal, (sdgCounts.get(r.sdg_goal) || 0) + 1);
    });
    const sdgDistribution = Array.from(sdgCounts.entries())
      .map(([goal, count]) => ({
        goal,
        count,
        percentage: totalProjects ? Math.round((count / totalProjects) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const countryMap = new Map<string, { projects: number; budget: number }>();
    rows.forEach(r => {
      if (!r.country_code) return;
      const name = codeToNameMap.get(r.country_code) || r.country_code;
      const entry = countryMap.get(name) || { projects: 0, budget: 0 };
      entry.projects += 1;
      entry.budget += Number(r.cost) || 0;
      countryMap.set(name, entry);
    });
    const baseCountryStats: CountryStat[] = Array.from(countryMap.entries())
      .map(([country, v]) => ({ country, projects: v.projects, budget: v.budget }));
    const countryStats = [...baseCountryStats].sort((a, b) => b.projects - a.projects).slice(0, 8);
    const countryStatsByBudget = [...baseCountryStats].sort((a, b) => b.budget - a.budget).slice(0, 8);

    const monthKeys: string[] = [];
    const monthBuckets = new Map<string, { projects: number; budget: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('en-US', { month: 'short' });
      monthKeys.push(key);
      monthBuckets.set(key, { projects: 0, budget: 0 });
    }
    rows.forEach(r => {
      if (!r.submitted_at) return;
      const key = new Date(r.submitted_at).toLocaleString('en-US', { month: 'short' });
      const entry = monthBuckets.get(key);
      if (entry) {
        entry.projects += 1;
        entry.budget += Number(r.cost) || 0;
      }
    });
    const monthlyTrends = monthKeys.map(month => ({ month, ...monthBuckets.get(month)! }));

    return {
      totalProjects,
      confirmedProjects,
      totalBudget,
      countriesActive,
      sdgDistribution,
      countryStats,
      countryStatsByBudget,
      monthlyTrends,
      verificationStats: {
        verified: confirmedProjects,
        pending: totalProjects - confirmedProjects,
      },
    };
  };

  const getSdgColor = (goal: number): string => {
    const colors: Record<number, string> = {
      1: "#E5243B", 2: "#DDA63A", 3: "#4C9F38", 4: "#C5192D", 5: "#FF3A21",
      6: "#26BDE2", 7: "#FCC30B", 8: "#A21942", 9: "#FD6925", 10: "#DD1367",
      11: "#FD9D24", 12: "#BF8B2E", 13: "#3F7E44", 14: "#0A97D9", 15: "#56C02B",
      16: "#00689D", 17: "#19486A",
    };
    return colors[goal] || "#666666";
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount}`;
  };

  const exportData = () => {
    if (!analytics || analytics.countryStats.length === 0) return;

    const dataToExport = analytics.countryStats;
    const headers = Object.keys(dataToExport[0]);
    const csvRows = [
      headers.join(','),
      ...dataToExport.map(row =>
        headers.map(header => {
            const val = row[header as keyof typeof row];
            if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
            return val;
        }).join(',')
      )
    ];

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sdg-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return <div>No analytics data available.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">SDG Analytics</h1>
        <Button onClick={exportData} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block text-muted-foreground">Country</label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="NGA">Nigeria</SelectItem>
                  <SelectItem value="KEN">Kenya</SelectItem>
                  <SelectItem value="ZAF">South Africa</SelectItem>
                  <SelectItem value="GHA">Ghana</SelectItem>
                  <SelectItem value="ETH">Ethiopia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-muted-foreground">Timeframe</label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProjects.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.confirmedProjects.toLocaleString()} confirmed
            </p>
          </CardContent>
        </Card>
        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalBudget)}</div>
            <p className="text-xs text-muted-foreground">Across {analytics.countriesActive} countries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries Active</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.countriesActive}</div>
            <p className="text-xs text-muted-foreground">in the current scope</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalProjects ? Math.round((analytics.verificationStats.verified / analytics.totalProjects) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">{analytics.verificationStats.verified.toLocaleString()} verified</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>SDG Goals Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.sdgDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reports yet for this filter.</p>
            ) : (
            <TooltipProvider>
              <div className="space-y-4">
                {analytics.sdgDistribution.map((sdg) => (
                  <Tooltip key={sdg.goal}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-4 cursor-help">
                        <div className="flex items-center gap-2 w-32 shrink-0">
                          <SdgIcon goal={sdg.goal.toString()} className="w-5 h-5" />
                          <span className="text-sm font-medium">SDG {sdg.goal}</span>
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="h-2 rounded-full" style={{ backgroundColor: getSdgColor(sdg.goal), width: `${sdg.percentage}%` }} />
                          </div>
                        </div>
                        <div className="w-24 text-right">
                          <span className="text-sm font-semibold">{sdg.percentage}%</span>
                          <span className="text-xs text-muted-foreground ml-2">({sdg.count})</span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{sdgGoalMap.get(sdg.goal.toString()) || `Information for SDG ${sdg.goal}`}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Project Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <div>
                <div className="font-bold text-lg">{analytics.verificationStats.verified.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Verified</div>
              </div>
              <div className="ml-auto text-lg font-semibold">{analytics.totalProjects ? Math.round((analytics.verificationStats.verified / analytics.totalProjects) * 100) : 0}%</div>
            </div>
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-500 mr-3" />
              <div>
                <div className="font-bold text-lg">{analytics.verificationStats.pending.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="ml-auto text-lg font-semibold">{analytics.totalProjects ? Math.round((analytics.verificationStats.pending / analytics.totalProjects) * 100) : 0}%</div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Countries by Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.countryStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reports yet for this filter.</p>
            ) : (
            <div className="space-y-4">
              {analytics.countryStats.map((country, index) => {
                const countryCode = countryCodeMap.get(country.country);
                return (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {countryCode ? (
                        <img
                          src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`}
                          width="20"
                          alt={`${country.country} flag`}
                          className="rounded-sm"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-mono">
                          {index + 1}
                        </div>
                      )}
                      <span className="font-medium">{country.country}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{country.projects.toLocaleString()} projects</div>
                      <div className="text-sm text-muted-foreground">{formatCurrency(country.budget)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Countries by Investment</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.countryStatsByBudget.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reports yet for this filter.</p>
            ) : (
            <div className="space-y-4">
              {analytics.countryStatsByBudget.map((country, index) => {
                const countryCode = countryCodeMap.get(country.country);
                return (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       {countryCode ? (
                        <img
                          src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`}
                          width="20"
                          alt={`${country.country} flag`}
                          className="rounded-sm"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-mono">
                          {index + 1}
                        </div>
                      )}
                      <span className="font-medium">{country.country}</span>
                    </div>
                    <div className="text-right">
                       <div className="font-medium">{formatCurrency(country.budget)}</div>
                      <div className="text-sm text-muted-foreground">{country.projects.toLocaleString()} projects</div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.monthlyTrends.map((month) => (
                <div key={month.month} className="flex items-center justify-between">
                  <span className="font-medium">{month.month}</span>
                  <div className="text-right">
                    <div className="font-medium">{month.projects.toLocaleString()} projects</div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(month.budget)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SdgDashboardView;
