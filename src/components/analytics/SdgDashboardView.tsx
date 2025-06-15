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
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { africanCountries } from "@/data/countries";
import { sdgGoals } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface CountryStat {
  country: string;
  projects: number;
  budget: number;
}

interface UserTypeTrend {
  'Citizen Reporter': number;
  'NGO Staff': number;
  'Government Official': number;
  'Researcher': number;
}

interface MonthlyUserTypeTrend {
  month: string;
  trends: UserTypeTrend;
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
  verificationStats: { verified: number; pending: number; disputed: number };
  monthlyUserTypeTrends: MonthlyUserTypeTrend[];
}

const countryCodeMap = new Map(africanCountries.map((c) => [c.name, c.code]));
const sdgGoalMap = new Map(sdgGoals.map(g => [g.value, g.label]));

const SdgDashboardView = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("6months");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    const timer = setTimeout(() => {
      fetchAnalytics();
    }, 1000); // 1 second delay to show skeleton
    return () => clearTimeout(timer);
  }, [selectedCountry, selectedTimeframe]);

  const fetchAnalytics = () => {
    setIsLoading(true);
    // In a real app, you'd fetch from an API. We'll use mock data.
    setAnalytics(getMockAnalytics());
    setIsLoading(false);
  };

  const getMockAnalytics = (): AnalyticsData => {
    const baseCountryStats: CountryStat[] = [
      { country: "Nigeria", projects: 298, budget: 12400000 },
      { country: "Kenya", projects: 234, budget: 8900000 },
      { country: "South Africa", projects: 187, budget: 11200000 },
      { country: "Ghana", projects: 156, budget: 5600000 },
      { country: "Ethiopia", projects: 134, budget: 4200000 },
      { country: "Uganda", projects: 98, budget: 2800000 },
      { country: "Tanzania", projects: 87, budget: 3100000 },
      { country: "Rwanda", projects: 53, budget: 1400000 },
    ];

    return {
      totalProjects: 1247,
      confirmedProjects: 892,
      totalBudget: 45600000,
      countriesActive: 12,
      sdgDistribution: [
        { goal: 6, count: 234, percentage: 18.8 },
        { goal: 4, count: 198, percentage: 15.9 },
        { goal: 3, count: 156, percentage: 12.5 },
        { goal: 7, count: 134, percentage: 10.7 },
        { goal: 2, count: 112, percentage: 9.0 },
        { goal: 1, count: 98, percentage: 7.9 },
        { goal: 8, count: 87, percentage: 7.0 },
        { goal: 11, count: 76, percentage: 6.1 },
        { goal: 5, count: 65, percentage: 5.2 },
        { goal: 13, count: 54, percentage: 4.3 },
        { goal: 9, count: 33, percentage: 2.6 },
      ],
      countryStats: [...baseCountryStats].sort((a,b) => b.projects - a.projects),
      countryStatsByBudget: [...baseCountryStats].sort((a,b) => b.budget - a.budget),
      monthlyTrends: [
        { month: "Jan", projects: 89, budget: 3200000 },
        { month: "Feb", projects: 112, budget: 4100000 },
        { month: "Mar", projects: 134, budget: 5200000 },
        { month: "Apr", projects: 156, budget: 6800000 },
        { month: "May", projects: 178, budget: 7900000 },
        { month: "Jun", projects: 203, budget: 9200000 },
      ],
      verificationStats: {
        verified: 892,
        pending: 234,
        disputed: 121,
      },
      monthlyUserTypeTrends: [
        { month: "Jan", trends: { 'Citizen Reporter': 60, 'NGO Staff': 15, 'Government Official': 10, 'Researcher': 4 } },
        { month: "Feb", trends: { 'Citizen Reporter': 70, 'NGO Staff': 20, 'Government Official': 12, 'Researcher': 10 } },
        { month: "Mar", trends: { 'Citizen Reporter': 80, 'NGO Staff': 25, 'Government Official': 15, 'Researcher': 14 } },
        { month: "Apr", trends: { 'Citizen Reporter': 95, 'NGO Staff': 30, 'Government Official': 18, 'Researcher': 13 } },
        { month: "May", trends: { 'Citizen Reporter': 110, 'NGO Staff': 35, 'Government Official': 20, 'Researcher': 13 } },
        { month: "Jun", trends: { 'Citizen Reporter': 120, 'NGO Staff': 40, 'Government Official': 25, 'Researcher': 18 } },
      ],
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
    if (!analytics) return;

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

  const userTypeTrendsChartData = analytics.monthlyUserTypeTrends.map(d => ({
    month: d.month,
    ...d.trends,
  }));

  const userTypeChartConfig = {
    'Citizen Reporter': { label: 'Citizen Reporter', color: '#3b82f6' },
    'NGO Staff': { label: 'NGO Staff', color: '#22c55e' },
    'Government Official': { label: 'Government Official', color: '#f97316' },
    'Researcher': { label: 'Researcher', color: '#8b5cf6' },
  }

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
              {Math.round((analytics.verificationStats.verified / analytics.totalProjects) * 100)}%
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
            <TooltipProvider>
              <div className="space-y-4">
                {analytics.sdgDistribution.map((sdg) => (
                  <Tooltip key={sdg.goal}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-4 cursor-help">
                        <div className="flex items-center gap-2 w-32 shrink-0">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getSdgColor(sdg.goal) }} />
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
              <div className="ml-auto text-lg font-semibold">{Math.round((analytics.verificationStats.verified / analytics.totalProjects) * 100)}%</div>
            </div>
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-500 mr-3" />
              <div>
                <div className="font-bold text-lg">{analytics.verificationStats.pending.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="ml-auto text-lg font-semibold">{Math.round((analytics.verificationStats.pending / analytics.totalProjects) * 100)}%</div>
            </div>
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-500 mr-3" />
              <div>
                <div className="font-bold text-lg">{analytics.verificationStats.disputed.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Disputed</div>
              </div>
              <div className="ml-auto text-lg font-semibold">{Math.round((analytics.verificationStats.disputed / analytics.totalProjects) * 100)}%</div>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Countries by Investment</CardTitle>
          </CardHeader>
          <CardContent>
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
                  <span className="font-medium">{month.month} 2025</span>
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
      <Card>
        <CardHeader>
          <CardTitle>Monthly Submissions by User Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={userTypeChartConfig} className="h-[300px] w-full">
            <BarChart data={userTypeTrendsChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="Citizen Reporter" stackId="a" fill="var(--color-Citizen Reporter)" />
              <Bar dataKey="NGO Staff" stackId="a" fill="var(--color-NGO Staff)" />
              <Bar dataKey="Government Official" stackId="a" fill="var(--color-Government Official)" />
              <Bar dataKey="Researcher" stackId="a" fill="var(--color-Researcher)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default SdgDashboardView;
