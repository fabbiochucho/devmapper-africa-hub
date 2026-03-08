import { useState, useEffect } from "react";
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
import { toast } from "@/components/ui/sonner";
import { Plus, ListTodo, LayoutGrid, Calendar, CheckCircle2, Clock, AlertTriangle, ArrowUpDown } from "lucide-react";

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
  review: <ArrowUpDown className="h-4 w-4 text-orange-500" />,
  done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  blocked: <AlertTriangle className="h-4 w-4 text-destructive" />,
};

export default function ProjectManagement() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");

  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [projects, setProjects] = useState<Report[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(projectId || "");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // New task form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  useEffect(() => {
    if (selectedProject) fetchTasks();
  }, [selectedProject]);

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("reports")
      .select("id, title")
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
      .from("project_tasks")
      .select("*")
      .eq("report_id", selectedProject)
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      setTasks((data as ProjectTask[]) || []);
    }
  };

  const createTask = async () => {
    if (!newTitle.trim() || !selectedProject || !user) return;
    const { error } = await supabase.from("project_tasks").insert({
      report_id: selectedProject,
      title: newTitle,
      description: newDescription || null,
      priority: newPriority,
      due_date: newDueDate || null,
      created_by: user.id,
    });
    if (error) {
      toast.error("Failed to create task");
    } else {
      toast.success("Task created");
      setNewTitle("");
      setNewDescription("");
      setNewPriority("medium");
      setNewDueDate("");
      setDialogOpen(false);
      fetchTasks();
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === "done") updates.completed_at = new Date().toISOString();
    else updates.completed_at = null;

    const { error } = await supabase.from("project_tasks").update(updates).eq("id", taskId);
    if (error) toast.error("Failed to update task");
    else fetchTasks();
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
    ? Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100)
    : 0;

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading projects...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Management</h1>
          <p className="text-muted-foreground">Manage tasks, timelines, and team assignments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedProject}><Plus className="mr-2 h-4 w-4" />Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Title</Label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Task title" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Task details..." />
              </div>
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
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
                </div>
              </div>
              <Button onClick={createTask} className="w-full">Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project Selector + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-4">
            <Label>Select Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger><SelectValue placeholder="Choose a project" /></SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tasks</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">{tasks.filter(t => t.status === "done").length} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionPercent}%</div>
            <Progress value={completionPercent} className="mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Task Views */}
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board"><LayoutGrid className="mr-2 h-4 w-4" />Board</TabsTrigger>
          <TabsTrigger value="list"><ListTodo className="mr-2 h-4 w-4" />List</TabsTrigger>
          <TabsTrigger value="timeline"><Calendar className="mr-2 h-4 w-4" />Timeline</TabsTrigger>
        </TabsList>

        {/* Kanban Board View */}
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
                        <div className="flex items-center gap-2">
                          <Badge className={priorityColors[task.priority]} variant="secondary">
                            {task.priority}
                          </Badge>
                          {task.due_date && (
                            <span className="text-xs text-muted-foreground">{task.due_date}</span>
                          )}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {status !== "done" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs"
                              onClick={() => updateTaskStatus(task.id, status === "todo" ? "in_progress" : status === "in_progress" ? "review" : "done")}
                            >
                              Move →
                            </Button>
                          )}
                        </div>
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

        {/* Timeline View */}
        <TabsContent value="timeline">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {tasks.filter(t => t.due_date).sort((a, b) => (a.due_date || "").localeCompare(b.due_date || "")).map(task => (
                  <div key={task.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${task.status === "done" ? "bg-green-500" : task.status === "blocked" ? "bg-destructive" : "bg-primary"}`} />
                      <div className="w-px h-8 bg-border" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{task.title}</p>
                        <Badge className={priorityColors[task.priority]} variant="secondary">{task.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Due: {task.due_date}</p>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.due_date).length === 0 && (
                  <p className="text-center text-muted-foreground">No tasks with due dates. Add due dates to see the timeline.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
