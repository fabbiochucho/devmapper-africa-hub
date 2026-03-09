import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListTodo, Clock, ArrowUpDown, CheckCircle2, AlertTriangle, Users, GripVertical } from "lucide-react";

interface KanbanTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  tags: string[];
}

interface KanbanBoardProps {
  tasks: KanbanTask[];
  onStatusChange: (taskId: string, newStatus: string) => void;
  hasAssignment: boolean;
}

const COLUMNS = [
  { key: "todo", label: "To Do", icon: <ListTodo className="h-4 w-4" />, color: "border-muted-foreground/30" },
  { key: "in_progress", label: "In Progress", icon: <Clock className="h-4 w-4 text-primary" />, color: "border-primary/30" },
  { key: "review", label: "Review", icon: <ArrowUpDown className="h-4 w-4 text-orange-500" />, color: "border-orange-500/30" },
  { key: "done", label: "Done", icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: "border-green-500/30" },
  { key: "blocked", label: "Blocked", icon: <AlertTriangle className="h-4 w-4 text-destructive" />, color: "border-destructive/30" },
];

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-orange-500/10 text-orange-600",
  urgent: "bg-destructive/10 text-destructive",
};

export default function KanbanBoard({ tasks, onStatusChange, hasAssignment }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key);
    return acc;
  }, {} as Record<string, KanbanTask[]>);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (draggedTask) {
      onStatusChange(draggedTask, targetStatus);
      setDraggedTask(null);
    }
  };

  const handleDragEnd = () => setDraggedTask(null);

  const getNextStatus = (current: string): string => {
    const flow: Record<string, string> = {
      todo: "in_progress",
      in_progress: "review",
      review: "done",
      blocked: "todo",
    };
    return flow[current] || current;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {COLUMNS.map(col => (
        <div
          key={col.key}
          className="space-y-2"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.key)}
        >
          <div className={`flex items-center gap-2 font-semibold text-sm px-2 py-1.5 rounded-md border-l-4 ${col.color} bg-muted/30`}>
            {col.icon}
            <span className="capitalize">{col.label}</span>
            <Badge variant="secondary" className="ml-auto h-5 text-xs">
              {tasksByStatus[col.key]?.length || 0}
            </Badge>
          </div>
          <div className="space-y-2 min-h-[120px] rounded-lg border border-dashed border-muted-foreground/20 p-2 transition-colors hover:border-muted-foreground/40">
            {tasksByStatus[col.key]?.map(task => (
              <Card
                key={task.id}
                className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                  draggedTask === task.id ? "opacity-50 scale-95" : ""
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start gap-1.5">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                    <p className="font-medium text-sm leading-tight">{task.title}</p>
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 pl-5">{task.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap pl-5">
                    <Badge className={priorityColors[task.priority]} variant="secondary">
                      {task.priority}
                    </Badge>
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground">{task.due_date}</span>
                    )}
                    {task.assigned_to && hasAssignment && (
                      <Badge variant="outline" className="text-xs gap-0.5">
                        <Users className="h-3 w-3" />Assigned
                      </Badge>
                    )}
                  </div>
                  {col.key !== "done" && (
                    <div className="pl-5">
                      <Select value={task.status} onValueChange={v => onStatusChange(task.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLUMNS.map(c => (
                            <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {(tasksByStatus[col.key]?.length || 0) === 0 && (
              <p className="text-xs text-muted-foreground/50 text-center py-6">Drop tasks here</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
