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
import {
  Plus, ListTodo, LayoutGrid, Calendar, CheckCircle2, Clock,
  AlertTriangle, ArrowUpDown, Lock, Users, BarChart3, Bot
} from "lucide-react";

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

interface Report { id: string; title: string; }

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-orange-500/10 text-orange-600",
  urgent: "bg-destructive/10 text-destructive",
};

const statusIcons: Record<string, React.ReactNode> = {
  todo: <ListTodo className="h-4 w-4" />,
  in_progress: <Clock className="h-4 w-4 text-primary" />,
  review: <ArrowUpDown className="h-4 w-4 text-orange-500" />,
  done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  blocked: <AlertTriangle className="h-4 w-4 text-destructive" />,
};

export default function ProjectManagement() {
  const { user } = useAuth();
  const { userPlan, canAccess } = useFeatureAccess();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");

  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [projects, setProjects] = useState<Report[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(projectId || "");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("board");
  const [showAI, setShowAI] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newEstHours, setNewEstHours] = useState("");

  // Feature tier gates
  const hasGantt = userPlan !== "free";
  const hasAssignment = userPlan !== "free";
  const hasResourceAlloc = userPlan === "pro" || userPlan === "advanced" || userPlan === "enterprise";
  const hasAICopilot = userPlan === "pro" || userPlan === "advanced" || userPlan === "enterprise";

  useEffect(() => { if (user) fetchProjects(); }, [user]);
  useEffect(() => { if (selectedProject) fetchTasks(); }, [selectedProject]);

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("reports").select("id, title")
      .eq("user_id", user!.id)
      .order("submitted_at", { ascending: false });
    if (data) {
      setProjects(data);
      if (!selectedProject && data.length > 0) setSelectedProject(data[0].id);
    }
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
      due_date: newDueDate || null,
      assigned_to: hasAssignment && newAssignee ? newAssignee : null,
      estimated_hours: newEstHours ? parseFloat(newEstHours) : null,
      created_by: user.id,
    });
    if (error) toast.error("Failed to create task");
    else {
      toast.success("Task created");
      setNewTitle(""); setNewDescription(""); setNewPriority("medium");
      setNewDueDate(""); setNewAssignee(""); setNewEstHours("");
      setDialogOpen(false);
      fetchTasks();
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === "done") updates.completed_at = new Date().toISOString();
    else updates.completed_at = null;
    const { error } = await supabase.from("project_tasks").update(updates).eq("id", taskId);
    if (!error) fetchTasks();
  };

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

  // Gantt data
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
          <p className="text-muted-foreground">Manage tasks, timelines, and team assignments</p>
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
                  <div><Label>Due Date</Label><Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} /></div>
                </div>
                {hasAssignment && (
                  <div><Label>Assign To (User ID)</Label><Input value={newAssignee} onChange={e => setNewAssignee(e.target.value)} placeholder="User ID" /></div>
                )}
                {hasResourceAlloc && (
                  <div><Label>Estimated Hours</Label><Input type="number" value={newEstHours} onChange={e => setNewEstHours(e.target.value)} placeholder="0" /></div>
                )}
                {!hasAssignment && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Lock className="h-4 w-4" />Upgrade to Lite+ for task assignment</div>
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

      {/* Task Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="board"><LayoutGrid className="mr-1 h-4 w-4" />Board</TabsTrigger>
          <TabsTrigger value="list"><ListTodo className="mr-1 h-4 w-4" />List</TabsTrigger>
          <TabsTrigger value="gantt" disabled={!hasGantt}>
            <Calendar className="mr-1 h-4 w-4" />Gantt {!hasGantt && <Lock className="ml-1 h-3 w-3" />}
          </TabsTrigger>
        </TabsList>

        {/* Kanban Board */}
        <TabsContent value="board">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(["todo", "in_progress", "review", "done"] as const).map(status => (
              <div key={status} className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm capitalize">
                  {statusIcons[status]}
                  {status.replace("_", " ")} ({tasksByStatus[status].length})
                </div>
                <div className="space-y-2 min-h-[100px] rounded-lg border border-dashed p-2">
                  {tasksByStatus[status].map(task => (
                    <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3 space-y-2">
                        <p className="font-medium text-sm">{task.title}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={priorityColors[task.priority]} variant="secondary">{task.priority}</Badge>
                          {task.due_date && <span className="text-xs text-muted-foreground">{task.due_date}</span>}
                          {task.assigned_to && hasAssignment && (
                            <Badge variant="outline" className="text-xs"><Users className="h-3 w-3 mr-1" />Assigned</Badge>
                          )}
                        </div>
                        {status !== "done" && (
                          <Button size="sm" variant="ghost" className="h-6 text-xs"
                            onClick={() => updateTaskStatus(task.id, status === "todo" ? "in_progress" : status === "in_progress" ? "review" : "done")}>
                            Move →
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
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

        {/* Gantt Chart View */}
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
      </Tabs>
    </div>
  );
}
