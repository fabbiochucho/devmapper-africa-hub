import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { toast } from "@/components/ui/sonner";
import UpgradePrompt from "@/components/UpgradePrompt";
import AICopilot from "@/components/ai/AICopilot";
import ProjectWorkspace from "@/components/pm/ProjectWorkspace";
import ProgressUpdateForm from "@/components/pm/ProgressUpdateForm";
import SPVFVerificationPanel from "@/components/pm/SPVFVerificationPanel";
import BudgetTracker from "@/components/pm/BudgetTracker";
import ImpactIndicators from "@/components/pm/ImpactIndicators";
import {
  Plus, ListTodo, LayoutGrid, Calendar, CheckCircle2, Clock,
  AlertTriangle, ArrowUpDown, Lock, Users, BarChart3, Bot,
  FolderOpen, Shield, DollarSign, Activity, FileText, Building2, Award
} from "lucide-react";
import KanbanBoard from "@/components/pm/KanbanBoard";
import ProcurementTracker from "@/components/pm/ProcurementTracker";
import ImpactScorecard from "@/components/scoring/ImpactScorecard";

interface ProjectTask {
  id: string;
  report_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  priority: string;
  status: string;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  tags: string[];
  sort_order: number;
  created_by: string;
  created_at: string;
}

interface Report {
  id: string;
  title: string;
  description: string;
  location: string | null;
  sdg_goal: number;
  project_status: string;
  beneficiaries: number | null;
  start_date: string | null;
  end_date: string | null;
  user_id: string | null;
}

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-orange-500/10 text-orange-600",
  urgent: "bg-destructive/10 text-destructive",
};

const statusIcons: Record<string, React.ReactNode> = {
  todo: <ListTodo className="h-4 w-4" />,
  in_progress: <Clock className="h-4 w-4 text-primary" />,
  review: <ArrowUpDown className="h-4 w-4 text-muted-foreground" />,
  done: <CheckCircle2 className="h-4 w-4 text-primary" />,
  blocked: <AlertTriangle className="h-4 w-4 text-destructive" />,
};

export default function ProjectManagement() {
  const { user } = useAuth();
  const { userPlan } = useFeatureAccess();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");

  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [projects, setProjects] = useState<Report[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(projectId || "");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("workspace");
  const [showAI, setShowAI] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newEstHours, setNewEstHours] = useState("");

  // Feature tier gates
  const hasGantt = userPlan !== "free";
  const hasAssignment = userPlan !== "free";
  const hasResourceAlloc = ["pro", "advanced", "enterprise"].includes(userPlan);
  const hasAICopilot = ["pro", "advanced", "enterprise"].includes(userPlan);

  useEffect(() => { if (user) fetchProjects(); }, [user]);
  useEffect(() => { if (selectedProject) fetchTasks(); }, [selectedProject]);

  const fetchProjects = async () => {
    // Fetch user's own projects AND projects they're affiliated with
    const [ownResult, affResult] = await Promise.all([
      supabase.from("reports").select("id, title, description, location, sdg_goal, project_status, beneficiaries, start_date, end_date, user_id")
        .eq("user_id", user!.id).order("submitted_at", { ascending: false }),
      supabase.from("project_affiliations").select("report_id, reports(id, title, description, location, sdg_goal, project_status, beneficiaries, start_date, end_date, user_id)")
        .eq("user_id", user!.id),
    ]);

    const projectMap = new Map<string, Report>();
    ownResult.data?.forEach(r => projectMap.set(r.id, r as Report));
    affResult.data?.forEach((a: any) => {
      if (a.reports && !projectMap.has(a.reports.id)) {
        projectMap.set(a.reports.id, a.reports as Report);
      }
    });

    const allProjects = Array.from(projectMap.values());
    setProjects(allProjects);
    if (!selectedProject && allProjects.length > 0) setSelectedProject(allProjects[0].id);
    setLoading(false);
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("project_tasks").select("*")
      .eq("report_id", selectedProject)
      .order("sort_order", { ascending: true });
    if (!error) setTasks((data as ProjectTask[]) || []);
  };

  const createTask = async () => {
    if (!newTitle.trim() || !selectedProject || !user) return;
    const { error } = await supabase.from("project_tasks").insert({
      report_id: selectedProject,
      title: newTitle,
      description: newDescription || null,
      priority: newPriority,
      start_date: newStartDate || null,
      due_date: newDueDate || null,
      assigned_to: hasAssignment && newAssignee ? newAssignee : null,
      estimated_hours: newEstHours ? parseFloat(newEstHours) : null,
      created_by: user.id,
    });
    if (error) toast.error("Failed to create task");
    else {
      toast.success("Task created");
      setNewTitle(""); setNewDescription(""); setNewPriority("medium");
      setNewDueDate(""); setNewStartDate(""); setNewAssignee(""); setNewEstHours("");
      setDialogOpen(false);
      fetchTasks();
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const updates: Record<string, any> = { status: newStatus };
    if (newStatus === "done") updates.completed_at = new Date().toISOString();
    else updates.completed_at = null;
    const { error } = await supabase.from("project_tasks").update(updates).eq("id", taskId);
    if (!error) fetchTasks();
  };

  const selectedReport = projects.find(p => p.id === selectedProject);
  const isOwner = selectedReport?.user_id === user?.id;

  const filteredTasks = filterStatus === "all" ? tasks : tasks.filter(t => t.status === filterStatus);
  const tasksByStatus = {
    todo: tasks.filter(t => t.status === "todo"),
    in_progress: tasks.filter(t => t.status === "in_progress"),
    review: tasks.filter(t => t.status === "review"),
    done: tasks.filter(t => t.status === "done"),
    blocked: tasks.filter(t => t.status === "blocked"),
  };
  const completionPercent = tasks.length > 0
    ? Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100) : 0;
  const totalEstHours = tasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);
  const totalActHours = tasks.reduce((s, t) => s + (t.actual_hours || 0), 0);

  const ganttTasks = useMemo(() =>
    tasks.filter(t => t.start_date || t.due_date).sort((a, b) =>
      (a.start_date || a.due_date || "").localeCompare(b.start_date || b.due_date || "")
    ), [tasks]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading projects...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Project Management</h1>
          <p className="text-muted-foreground">Full lifecycle management — plan, implement, monitor, verify</p>
        </div>
        <div className="flex gap-2">
          {hasAICopilot && (
            <Button variant="outline" onClick={() => setShowAI(!showAI)}>
              <Bot className="mr-2 h-4 w-4" />{showAI ? "Hide" : "AI"} Copilot
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedProject}><Plus className="mr-2 h-4 w-4" />Add Task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Title</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Task title" /></div>
                <div><Label>Description</Label><Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Task details..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Select value={newPriority} onValueChange={setNewPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Start Date</Label><Input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Due Date</Label><Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} /></div>
                  {hasAssignment ? (
                    <div><Label>Assign To (User ID)</Label><Input value={newAssignee} onChange={e => setNewAssignee(e.target.value)} placeholder="User ID" /></div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Lock className="h-4 w-4" />Upgrade to Lite+ for assignments</div>
                  )}
                </div>
                {hasResourceAlloc && (
                  <div><Label>Estimated Hours</Label><Input type="number" value={newEstHours} onChange={e => setNewEstHours(e.target.value)} placeholder="0" /></div>
                )}
                <Button onClick={createTask} className="w-full">Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {showAI && hasAICopilot && (
        <AICopilot projectData={{ projectId: selectedProject, taskCount: tasks.length, completionPercent }} />
      )}

      {/* Project Selector + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-4">
            <Label>Select Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger><SelectValue placeholder="Choose a project" /></SelectTrigger>
              <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tasks</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">{tasksByStatus.done.length} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionPercent}%</div>
            <Progress value={completionPercent} className="mt-1" />
          </CardContent>
        </Card>
        {hasResourceAlloc ? (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Hours</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalActHours}/{totalEstHours}</div>
              <p className="text-xs text-muted-foreground">actual / estimated</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex items-center justify-center">
            <CardContent className="pt-4 text-center">
              <Lock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Resource tracking<br />Pro+ plan</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="workspace"><FolderOpen className="mr-1 h-4 w-4" />Workspace</TabsTrigger>
          <TabsTrigger value="board"><LayoutGrid className="mr-1 h-4 w-4" />Board</TabsTrigger>
          <TabsTrigger value="list"><ListTodo className="mr-1 h-4 w-4" />List</TabsTrigger>
          <TabsTrigger value="gantt" disabled={!hasGantt}>
            <Calendar className="mr-1 h-4 w-4" />Gantt {!hasGantt && <Lock className="ml-1 h-3 w-3" />}
          </TabsTrigger>
          <TabsTrigger value="budget"><DollarSign className="mr-1 h-4 w-4" />Budget</TabsTrigger>
          <TabsTrigger value="indicators"><Activity className="mr-1 h-4 w-4" />Impact</TabsTrigger>
          <TabsTrigger value="updates"><FileText className="mr-1 h-4 w-4" />Updates</TabsTrigger>
          <TabsTrigger value="verification"><Shield className="mr-1 h-4 w-4" />Verification</TabsTrigger>
        </TabsList>

        {/* Project Workspace */}
        <TabsContent value="workspace">
          {selectedProject && selectedReport ? (
            <ProjectWorkspace reportId={selectedProject} report={selectedReport} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Select a project to view its workspace.</CardContent></Card>
          )}
        </TabsContent>

        {/* Kanban Board */}
        <TabsContent value="board">
          <KanbanBoard
            tasks={tasks}
            onStatusChange={updateTaskStatus}
            hasAssignment={hasAssignment}
          />
        </TabsContent>

        {/* List View */}
        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-4 border-b">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="divide-y">
                {filteredTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      {statusIcons[task.status]}
                      <div>
                        <p className="font-medium">{task.title}</p>
                        {task.description && <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={priorityColors[task.priority]} variant="secondary">{task.priority}</Badge>
                      {task.due_date && <span className="text-sm text-muted-foreground">{task.due_date}</span>}
                      <Select value={task.status} onValueChange={v => updateTaskStatus(task.id, v)}>
                        <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">Todo</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                {filteredTasks.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    {tasks.length === 0 ? "No tasks yet. Create your first task!" : "No tasks match the filter."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gantt Chart */}
        <TabsContent value="gantt">
          {!hasGantt ? (
            <UpgradePrompt feature="gantt_chart" requiredPlan="lite" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Gantt Timeline</CardTitle>
                <p className="text-sm text-muted-foreground">Visual timeline of tasks with start and due dates</p>
              </CardHeader>
              <CardContent>
                {ganttTasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Add start dates and due dates to tasks to see the Gantt view.</p>
                ) : (
                  <div className="space-y-2 overflow-x-auto">
                    {(() => {
                      const allDates = ganttTasks.flatMap(t => [t.start_date, t.due_date].filter(Boolean) as string[]);
                      const minDate = new Date(Math.min(...allDates.map(d => new Date(d).getTime())));
                      const maxDate = new Date(Math.max(...allDates.map(d => new Date(d).getTime())));
                      const totalDays = Math.max(Math.ceil((maxDate.getTime() - minDate.getTime()) / 86400000), 1);
                      return ganttTasks.map(task => {
                        const start = new Date(task.start_date || task.due_date!);
                        const end = new Date(task.due_date || task.start_date!);
                        const leftPct = ((start.getTime() - minDate.getTime()) / 86400000 / totalDays) * 100;
                        const widthPct = Math.max(((end.getTime() - start.getTime()) / 86400000 / totalDays) * 100, 2);
                        const isDone = task.status === "done";
                        return (
                          <div key={task.id} className="flex items-center gap-3 h-8">
                            <div className="w-40 text-sm truncate font-medium shrink-0">{task.title}</div>
                            <div className="flex-1 relative h-6 bg-muted/50 rounded">
                              <div
                                className={`absolute h-full rounded ${isDone ? "bg-green-500/70" : "bg-primary/70"}`}
                                style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: 8 }}
                              />
                            </div>
                            <div className="w-20 text-xs text-muted-foreground shrink-0">{task.due_date}</div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Budget */}
        <TabsContent value="budget">
          {selectedProject ? (
            <BudgetTracker reportId={selectedProject} isOwner={isOwner} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Select a project first.</CardContent></Card>
          )}
        </TabsContent>

        {/* Impact Indicators */}
        <TabsContent value="indicators">
          {selectedProject ? (
            <ImpactIndicators reportId={selectedProject} isOwner={isOwner} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Select a project first.</CardContent></Card>
          )}
        </TabsContent>

        {/* Progress Updates */}
        <TabsContent value="updates">
          {selectedProject ? (
            <div className="space-y-4">
              {isOwner && <ProgressUpdateForm reportId={selectedProject} onCreated={fetchTasks} />}
              <UpdatesList reportId={selectedProject} />
            </div>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Select a project first.</CardContent></Card>
          )}
        </TabsContent>

        {/* Verification */}
        <TabsContent value="verification">
          {selectedProject ? (
            <SPVFVerificationPanel reportId={selectedProject} isOwner={isOwner} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Select a project first.</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-component for updates list
function UpdatesList({ reportId }: { reportId: string }) {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("project_updates").select("*").eq("report_id", reportId)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setUpdates(data); setLoading(false); });
  }, [reportId]);

  if (loading) return <div className="text-center py-4 text-muted-foreground">Loading updates...</div>;

  if (updates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No progress updates yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Progress Timeline</h3>
      {updates.map((u: any) => (
        <Card key={u.id}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{u.progress_percent}% progress</Badge>
              <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-sm">{u.update_text}</p>
            {u.evidence_url && (
              <a href={u.evidence_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">View evidence</a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
