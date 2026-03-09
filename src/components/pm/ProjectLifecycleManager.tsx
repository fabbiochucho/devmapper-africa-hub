import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const LIFECYCLE_STAGES = [
  { key: "planning", label: "Planning", order: 0 },
  { key: "approved", label: "Approved", order: 1 },
  { key: "in_progress", label: "Implementation", order: 2 },
  { key: "active", label: "Active", order: 3 },
  { key: "completed", label: "Completed", order: 4 },
  { key: "verified", label: "Verified", order: 5 },
];

const VALID_TRANSITIONS: Record<string, string[]> = {
  planning: ["approved", "in_progress"],
  approved: ["in_progress", "active"],
  in_progress: ["active", "completed", "delayed"],
  active: ["completed", "delayed"],
  delayed: ["active", "completed"],
  completed: ["verified"],
};

interface ProjectLifecycleManagerProps {
  reportId: string;
  currentStatus: string;
  isOwner: boolean;
  onStatusChange: (newStatus: string) => void;
}

export default function ProjectLifecycleManager({
  reportId,
  currentStatus,
  isOwner,
  onStatusChange,
}: ProjectLifecycleManagerProps) {
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const validNext = VALID_TRANSITIONS[currentStatus] || [];
  const currentOrder = LIFECYCLE_STAGES.find(s => s.key === currentStatus)?.order ?? -1;

  const handleTransition = async () => {
    if (!newStatus) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("reports")
        .update({ project_status: newStatus })
        .eq("id", reportId);
      if (error) throw error;

      // Log the transition as a project update
      await supabase.from("project_updates").insert({
        report_id: reportId,
        update_text: `Status changed from "${currentStatus}" to "${newStatus}"${note ? `: ${note}` : ""}`,
        progress_percent: Math.round(((LIFECYCLE_STAGES.find(s => s.key === newStatus)?.order ?? 0) / 5) * 100),
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });

      toast.success(`Status updated to ${newStatus}`);
      onStatusChange(newStatus);
      setOpen(false);
      setNote("");
      setNewStatus("");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Visual lifecycle bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {LIFECYCLE_STAGES.map((stage, i) => {
          const isCurrent = stage.key === currentStatus;
          const isPast = stage.order < currentOrder;
          return (
            <div key={stage.key} className="flex items-center gap-1">
              <div
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isPast
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isPast && <CheckCircle2 className="h-3 w-3" />}
                {stage.label}
              </div>
              {i < LIFECYCLE_STAGES.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Transition button */}
      {isOwner && validNext.length > 0 && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <ArrowRight className="mr-2 h-4 w-4" />
              Advance Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Project Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Status</Label>
                <Badge variant="secondary">{currentStatus}</Badge>
              </div>
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue placeholder="Select next status" /></SelectTrigger>
                  <SelectContent>
                    {validNext.map(s => (
                      <SelectItem key={s} value={s}>
                        {LIFECYCLE_STAGES.find(st => st.key === s)?.label || s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for status change..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleTransition} disabled={!newStatus || saving}>
                  {saving ? "Updating..." : "Update Status"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
