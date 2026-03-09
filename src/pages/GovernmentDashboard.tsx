import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ListChecks, Hourglass, CheckCircle2, LayoutDashboard, Loader2, ShieldAlert, Plus, Bot } from "lucide-react";
import AICopilot from '@/components/ai/AICopilot';
import ComplianceAssessment from '@/components/compliance/ComplianceAssessment';
import { sdgGoalColors, sdgGoals } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
  start_date: string | null;
  end_date: string | null;
  beneficiaries: number | null;
};

type SdgProgressRow = { goal: number; projects: number; budget: number; progress: number };
type RegionalRow = { region: string; projects: number; budget: number };
type ActivityRow = { id: string; title: string; type: "project_created" | "budget_updated" | "project_completed"; timestamp: string; amount?: number; location?: string };

const GovernmentDashboard = () => {
  const { user: authUser, loading: authLoading, hasRole } = useAuth();
  const [projects, setProjects] = useState<GovProject[]>([]);
  const [areasById, setAreasById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<GovProject | null>(null);
  const [editSpent, setEditSpent] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '', description: '', budget: '', currency: 'USD', location: '',
    sdg_goals: [] as number[], status: 'planning', visibility: 'public',
    start_date: '', end_date: '', beneficiaries: '',
  });

  const loadProjects = async () => {
    if (!authUser) { setProjects([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("government_projects")
        .select("id, title, budget, spent_amount, currency, status, sdg_goals, admin_area_id, location, created_at, start_date, end_date, beneficiaries")
        .eq("government_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const rows = (data || []) as GovProject[];
      setProjects(rows);

      const areaIds = Array.from(new Set(rows.map(r => r.admin_area_id).filter(Boolean))) as string[];
      if (areaIds.length) {
        const { data: areas } = await supabase.from("admin_areas").select("id, name").in("id", areaIds);
        if (areas) {
          const map: Record<string, string> = {};
          areas.forEach(a => (map[a.id] = a.name));
          setAreasById(map);
        }
      }
    } catch (e) {
      console.error("Error loading government dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (!authLoading) loadProjects(); }, [authUser, authLoading]);

  const toggleSdgGoal = (goalNumber: number) => {
    setFormData(prev => ({
      ...prev,
      sdg_goals: prev.sdg_goals.includes(goalNumber)
        ? prev.sdg_goals.filter(g => g !== goalNumber)
        : [...prev.sdg_goals, goalNumber]
    }));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    if (formData.sdg_goals.length === 0) { toast.error('Select at least one SDG goal'); return; }

    try {
      const { error } = await supabase.from('government_projects').insert([{
        government_id: authUser.id,
        title: formData.title,
        description: formData.description,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        currency: formData.currency,
        location: formData.location || null,
        sdg_goals: formData.sdg_goals,
        status: formData.status,
        visibility: formData.visibility,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        beneficiaries: formData.beneficiaries ? parseInt(formData.beneficiaries) : null,
      }]);
      if (error) throw error;
      toast.success('Project created successfully!');
      setShowCreateDialog(false);
      setFormData({ title: '', description: '', budget: '', currency: 'USD', location: '', sdg_goals: [], status: 'planning', visibility: 'public', start_date: '', end_date: '', beneficiaries: '' });
      loadProjects();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create project');
    }
  };

  const sdgGoalMap = new Map(sdgGoals.map(g => [Number(g.value), g.label.replace(/Goal \d+: /, "")]));

  const overview = useMemo(() => {
    const totalProjects = projects.length;
    const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
    const pendingReview = projects.filter(p => p.status === "planning").length;
    const completed = projects.filter(p => p.status === "completed").length;
    const completionRate = totalProjects > 0 ? Math.round((completed / totalProjects) * 100) : 0;
    return { totalProjects, totalBudget, pendingReview, completionRate };
  }, [projects]);

  const sdgProgress: SdgProgressRow[] = useMemo(() => {
    const map = new Map<number, { projects: number; budget: number; completed: number }>();
    for (const p of projects) {
      for (const g of (p.sdg_goals || [])) {
        const cur = map.get(g) || { projects: 0, budget: 0, completed: 0 };
        cur.projects += 1; cur.budget += p.budget || 0;
        if (p.status === "completed") cur.completed += 1;
        map.set(g, cur);
      }
    }
    return Array.from(map.entries())
      .map(([goal, v]) => ({ goal, projects: v.projects, budget: v.budget, progress: v.projects > 0 ? Math.round((v.completed / v.projects) * 100) : 0 }))
      .sort((a, b) => b.projects - a.projects).slice(0, 12);
  }, [projects]);

  const regionalStats: RegionalRow[] = useMemo(() => {
    const map = new Map<string, { projects: number; budget: number }>();
    for (const p of projects) {
      const region = (p.admin_area_id && areasById[p.admin_area_id]) || p.location || "Unspecified";
      const cur = map.get(region) || { projects: 0, budget: 0 };
      cur.projects += 1; cur.budget += p.budget || 0;
      map.set(region, cur);
    }
    return Array.from(map.entries()).map(([region, v]) => ({ region, ...v })).sort((a, b) => b.projects - a.projects).slice(0, 10);
  }, [projects, areasById]);

  const recentActivity: ActivityRow[] = useMemo(() => {
    return projects.slice(0, 8).map(p => ({
      id: p.id, title: p.status === "completed" ? `Project completed: ${p.title}` : `Project updated: ${p.title}`,
      type: (p.status === "completed" ? "project_completed" : "project_created") as ActivityRow["type"],
      timestamp: p.created_at, amount: p.budget || undefined, location: p.location || undefined,
    }));
  }, [projects]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" }).format(amount);

  const getActivityIcon = (type: ActivityRow["type"]) => {
    switch (type) {
      case "project_completed": return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case "budget_updated": return <DollarSign className="h-5 w-5 text-primary" />;
      default: return <ListChecks className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (!authLoading && !loading && (!hasRole("government_official") && !hasRole("admin") && !hasRole("platform_admin"))) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You need to be a Government Official to access this dashboard.</p>
            <Button onClick={() => navigate("/auth")} variant="outline">Register as Government Official</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || authLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Government Dashboard</h1>
            {/* Regional filter */}
            {Object.keys(areasById).length > 0 && (
              <div className="mt-2">
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue placeholder="Filter by region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {Object.entries(areasById).map(([id, name]) => (
                      <SelectItem key={id} value={id}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Project</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Government Project</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Project title" required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Project description" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Budget</Label>
                  <Input type="number" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={v => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="NGN">NGN</SelectItem>
                      <SelectItem value="KES">KES</SelectItem>
                      <SelectItem value="ZAR">ZAR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Lagos, Nigeria" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Beneficiaries</Label>
                <Input type="number" value={formData.beneficiaries} onChange={e => setFormData({ ...formData, beneficiaries: e.target.value })} placeholder="Number of people impacted" />
              </div>
              <div className="space-y-2">
                <Label>SDG Goals <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {sdgGoals.map(goal => (
                    <label key={goal.number} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded p-1">
                      <Checkbox checked={formData.sdg_goals.includes(goal.number)} onCheckedChange={() => toggleSdgGoal(goal.number)} />
                      <span className="truncate">SDG {goal.number}</span>
                    </label>
                  ))}
                </div>
                {formData.sdg_goals.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.sdg_goals.sort((a,b) => a-b).map(g => <Badge key={g} variant="secondary" className="text-xs">SDG {g}</Badge>)}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select value={formData.visibility} onValueChange={v => setFormData({ ...formData, visibility: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button type="submit">Create Project</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Projects</CardTitle><ListChecks className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{overview.totalProjects}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Budget</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(overview.totalBudget)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending Review</CardTitle><Hourglass className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{overview.pendingReview}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Completion Rate</CardTitle><CheckCircle2 className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{overview.completionRate}%</div></CardContent></Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>SDG Progress</CardTitle><CardDescription>Aggregated progress across your government projects.</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>SDG</TableHead><TableHead className="text-right">Projects</TableHead><TableHead className="text-right">Budget</TableHead><TableHead>Progress</TableHead></TableRow></TableHeader>
              <TableBody>
                {sdgProgress.map(item => (
                  <TableRow key={item.goal}>
                    <TableCell><div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sdgGoalColors[item.goal] }} /><span>{sdgGoalMap.get(item.goal) || `Goal ${item.goal}`}</span></div></TableCell>
                    <TableCell className="text-right">{item.projects}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.budget)}</TableCell>
                    <TableCell><div className="flex items-center gap-2"><Progress value={item.progress} className="w-24" /><span className="text-xs text-muted-foreground">{item.progress}%</span></div></TableCell>
                  </TableRow>
                ))}
                {sdgProgress.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No projects yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Regional Stats</CardTitle><CardDescription>Project distribution and budget by region.</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Region</TableHead><TableHead className="text-right">Projects</TableHead><TableHead className="text-right">Budget</TableHead></TableRow></TableHeader>
              <TableBody>
                {regionalStats.map(item => (
                  <TableRow key={item.region}><TableCell className="font-medium">{item.region}</TableCell><TableCell className="text-right">{item.projects}</TableCell><TableCell className="text-right">{formatCurrency(item.budget)}</TableCell></TableRow>
                ))}
                {regionalStats.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No regional data yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map(activity => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="mt-1">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.amount ? `Budget: ${formatCurrency(activity.amount)}` : ""}{activity.location ? ` • Location: ${activity.location}` : ""}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</div>
              </div>
            ))}
            {recentActivity.length === 0 && <div className="text-center py-8 text-muted-foreground">No recent activity.</div>}
          </div>
        </CardContent>
      </Card>

      {/* Project List with Inline Edit */}
      <Card>
        <CardHeader><CardTitle>All Projects</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Beneficiaries</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.location || 'No location'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingProject?.id === p.id ? (
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{p.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(p.budget || 0)}</TableCell>
                  <TableCell className="text-right">
                    {editingProject?.id === p.id ? (
                      <Input type="number" value={editSpent} onChange={e => setEditSpent(e.target.value)} className="w-24 h-8" />
                    ) : (
                      formatCurrency(p.spent_amount || 0)
                    )}
                  </TableCell>
                  <TableCell className="text-right">{p.beneficiaries?.toLocaleString() || '—'}</TableCell>
                  <TableCell>
                    {editingProject?.id === p.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" disabled={savingEdit} onClick={async () => {
                          setSavingEdit(true);
                          try {
                            const { error } = await supabase.from('government_projects')
                              .update({ spent_amount: editSpent ? parseFloat(editSpent) : null, status: editStatus })
                              .eq('id', p.id);
                            if (error) throw error;
                            toast.success('Project updated');
                            setEditingProject(null);
                            loadProjects();
                          } catch { toast.error('Failed to update'); }
                          finally { setSavingEdit(false); }
                        }}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingProject(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => {
                        setEditingProject(p);
                        setEditSpent(String(p.spent_amount || 0));
                        setEditStatus(p.status);
                      }}>Edit</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {projects.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No projects yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ComplianceAssessment actorType="government" />

      {/* AI Copilot */}
      <AICopilot projectData={{ context: 'government_oversight', projectCount: projects.length }} />
    </div>
  );
};

export default GovernmentDashboard;
