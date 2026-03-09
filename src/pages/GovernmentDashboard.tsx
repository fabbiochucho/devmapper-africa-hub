import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { DollarSign, ListChecks, Hourglass, CheckCircle2, LayoutDashboard, Loader2, ShieldAlert } from "lucide-react";
import { sdgGoalColors, sdgGoals } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type GovProject = {
  id: string;
  title: string;
  budget: number | null;
  spent_amount: number | null;
  currency: string;
  status: string;
  sdg_goals: number[];
  admin_area_id: string | null;
  location: string | null;
  created_at: string;
};

type SdgProgressRow = {
  goal: number;
  projects: number;
  budget: number;
  progress: number; // 0-100
};

type RegionalRow = {
  region: string;
  projects: number;
  budget: number;
};

type ActivityRow = {
  id: string;
  title: string;
  type: "project_created" | "budget_updated" | "project_completed";
  timestamp: string;
  amount?: number;
  location?: string;
};

const GovernmentDashboard = () => {
  const { user: authUser, loading: authLoading, hasRole } = useAuth();
  const [projects, setProjects] = useState<GovProject[]>([]);
  const [areasById, setAreasById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if (!authUser) {
        setProjects([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("government_projects")
          .select(
            "id, title, budget, spent_amount, currency, status, sdg_goals, admin_area_id, location, created_at"
          )
          .eq("government_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(500);

        if (error) throw error;

        const rows = (data || []) as GovProject[];
        setProjects(rows);

        const areaIds = Array.from(
          new Set(rows.map((r) => r.admin_area_id).filter(Boolean))
        ) as string[];

        if (areaIds.length) {
          const { data: areas, error: areasError } = await supabase
            .from("admin_areas")
            .select("id, name")
            .in("id", areaIds);

          if (!areasError && areas) {
            const map: Record<string, string> = {};
            areas.forEach((a) => (map[a.id] = a.name));
            setAreasById(map);
          }
        }
      } catch (e) {
        console.error("Error loading government dashboard:", e);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) load();
  }, [authUser, authLoading]);

  // Role-based access control
  if (!authLoading && !loading && (!hasRole("government_official") && !hasRole("admin") && !hasRole("platform_admin"))) {
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
            <Button onClick={() => navigate("/auth")} variant="outline">
              Register as Government Official
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const sdgGoalMap = new Map(sdgGoals.map((g) => [Number(g.value), g.label.replace(/Goal \d+: /, "")]));

  const overview = useMemo(() => {
    const totalProjects = projects.length;
    const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
    const pendingReview = projects.filter((p) => p.status === "planning").length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const completionRate = totalProjects > 0 ? Math.round((completed / totalProjects) * 100) : 0;
    return { totalProjects, totalBudget, pendingReview, completionRate };
  }, [projects]);

  const sdgProgress: SdgProgressRow[] = useMemo(() => {
    const map = new Map<number, { projects: number; budget: number; completed: number }>();

    for (const p of projects) {
      const goals = p.sdg_goals || [];
      for (const g of goals) {
        const cur = map.get(g) || { projects: 0, budget: 0, completed: 0 };
        cur.projects += 1;
        cur.budget += p.budget || 0;
        if (p.status === "completed") cur.completed += 1;
        map.set(g, cur);
      }
    }

    return Array.from(map.entries())
      .map(([goal, v]) => ({
        goal,
        projects: v.projects,
        budget: v.budget,
        progress: v.projects > 0 ? Math.round((v.completed / v.projects) * 100) : 0,
      }))
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 12);
  }, [projects]);

  const regionalStats: RegionalRow[] = useMemo(() => {
    const map = new Map<string, { projects: number; budget: number }>();

    for (const p of projects) {
      const region =
        (p.admin_area_id && areasById[p.admin_area_id]) ||
        p.location ||
        "Unspecified";
      const cur = map.get(region) || { projects: 0, budget: 0 };
      cur.projects += 1;
      cur.budget += p.budget || 0;
      map.set(region, cur);
    }

    return Array.from(map.entries())
      .map(([region, v]) => ({ region, projects: v.projects, budget: v.budget }))
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 10);
  }, [projects, areasById]);

  const recentActivity: ActivityRow[] = useMemo(() => {
    return projects.slice(0, 8).map((p) => ({
      id: p.id,
      title: p.status === "completed" ? `Project completed: ${p.title}` : `Project updated: ${p.title}`,
      type: p.status === "completed" ? "project_completed" : "project_created",
      timestamp: p.created_at,
      amount: p.budget || undefined,
      location: p.location || undefined,
    }));
  }, [projects]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
    }).format(amount);
  };

  const getActivityIcon = (type: ActivityRow["type"]) => {
    switch (type) {
      case "project_completed":
        return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case "budget_updated":
        return <DollarSign className="h-5 w-5 text-primary" />;
      default:
        return <ListChecks className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <LayoutDashboard className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Government Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.totalBudget)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.pendingReview}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SDG Progress</CardTitle>
            <CardDescription>Aggregated progress across your government projects.</CardDescription>
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
                {sdgProgress.map((item) => (
                  <TableRow key={item.goal}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sdgGoalColors[item.goal] }} />
                        <span>{sdgGoalMap.get(item.goal) || `Goal ${item.goal}`}</span>
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
                {sdgProgress.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No projects yet.
                    </TableCell>
                  </TableRow>
                )}
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
                {regionalStats.map((item) => (
                  <TableRow key={item.region}>
                    <TableCell className="font-medium">{item.region}</TableCell>
                    <TableCell className="text-right">{item.projects}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.budget)}</TableCell>
                  </TableRow>
                ))}
                {regionalStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No regional data yet.
                    </TableCell>
                  </TableRow>
                )}
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
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="mt-1">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.amount ? `Budget: ${formatCurrency(activity.amount)}` : ""}
                    {activity.location ? ` • Location: ${activity.location}` : ""}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No recent activity.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GovernmentDashboard;
