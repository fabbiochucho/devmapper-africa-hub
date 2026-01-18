import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { getGovernmentDashboardData, GovernmentDashboardData } from "@/data/mockGovernmentDashboard";
import { DollarSign, ListChecks, Hourglass, CheckCircle2, LayoutDashboard, Loader2, ShieldAlert } from "lucide-react";
import { sdgGoalColors, sdgGoals } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  full_name: string | null;
  country: string | null;
  organization: string | null;
}

const GovernmentDashboard = () => {
    const { user: authUser, loading: authLoading, hasRole } = useAuth();
    const [data, setData] = useState<GovernmentDashboardData | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                let countryCode = "DEFAULT";
                
                // Get user profile from Supabase if authenticated
                if (authUser) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('full_name, country, organization')
                        .eq('user_id', authUser.id)
                        .single();
                    
                    if (profileData) {
                        setProfile(profileData);
                        // Map country name to code if available
                        countryCode = profileData.country || "DEFAULT";
                    }
                }
                
                const dashboardData = getGovernmentDashboardData(countryCode);
                setData(dashboardData);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
                const dashboardData = getGovernmentDashboardData("DEFAULT");
                setData(dashboardData);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            loadDashboardData();
        }
    }, [authUser, authLoading]);

    if (loading || authLoading || !data) {
        return (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )
    }

    // Role-based access control
    if (!hasRole('government_official') && !hasRole('admin') && !hasRole('platform_admin')) {
        return (
          <div className="flex items-center justify-center h-full p-8">
            <Card className="w-full max-w-md text-center">
              <CardContent className="pt-6">
                <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-4" />
                <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-4">
                  You need to be a Government Official to access this dashboard.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  If you are a government official, please register with your official government email address (.gov domain).
                </p>
                <Button onClick={() => navigate('/auth')} variant="outline">
                  Register as Government Official
                </Button>
              </CardContent>
            </Card>
          </div>
        )
    }
    
    const sdgGoalMap = new Map(sdgGoals.map(g => [g.value, g.label.replace(/Goal \d+: /, '')]));

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(amount);
    }
    
    const getActivityIcon = (type: string) => {
        switch (type) {
          case 'project_approved':
            return <CheckCircle2 className="h-5 w-5 text-green-500" />;
          case 'budget_allocated':
            return <DollarSign className="h-5 w-5 text-blue-500" />;
          default:
            return <ListChecks className="h-5 w-5 text-gray-500" />;
        }
      };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <LayoutDashboard className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Government Dashboard {profile?.country && `- ${profile.country}`}</h1>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                        <ListChecks className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.overview.totalProjects}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.overview.totalBudget)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <Hourglass className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.overview.pendingReview}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.overview.completionRate}%</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>SDG Progress</CardTitle>
                        <CardDescription>Progress towards key Sustainable Development Goals.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SDG</TableHead>
                                    <TableHead className="text-right">Projects</TableHead>
                                    <TableHead className="text-right">Budget</TableHead>
                                    <TableHead>Progress</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.sdgProgress.map((item) => (
                                    <TableRow key={item.goal}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sdgGoalColors[item.goal] }} />
                                                <span>{sdgGoalMap.get(String(item.goal)) || `Goal ${item.goal}`}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{item.projects}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.budget)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Progress value={item.progress} className="w-24" />
                                                <span className="text-xs text-muted-foreground">{item.progress}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Regional Stats</CardTitle>
                        <CardDescription>Project distribution and budget by region.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Region</TableHead>
                                    <TableHead className="text-right">Projects</TableHead>
                                    <TableHead className="text-right">Budget</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.regionalStats.map((item) => (
                                    <TableRow key={item.region}>
                                        <TableCell className="font-medium">{item.region}</TableCell>
                                        <TableCell className="text-right">{item.projects}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.budget)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-4">
                                <div className="mt-1">{getActivityIcon(activity.type)}</div>
                                <div className="flex-1">
                                    <p className="font-medium">{activity.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {activity.type === 'budget_allocated' && activity.amount && `Amount: ${formatCurrency(activity.amount)}`}
                                        {activity.type === 'project_approved' && activity.location && `Location: ${activity.location}`}
                                    </p>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default GovernmentDashboard;
