import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Plus, Pencil, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useProjectMilestones, ProjectMilestone } from '@/hooks/useMyProjects';
import { format } from 'date-fns';

interface ProjectMilestonesProps {
  reportId: string;
  canEdit: boolean;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: 'bg-muted text-muted-foreground', label: 'Pending' },
  in_progress: { icon: AlertCircle, color: 'bg-primary/10 text-primary', label: 'In Progress' },
  completed: { icon: CheckCircle2, color: 'bg-green-100 text-green-800', label: 'Completed' },
  overdue: { icon: AlertCircle, color: 'bg-destructive/10 text-destructive', label: 'Overdue' },
};

const ProjectMilestones = ({ reportId, canEdit }: ProjectMilestonesProps) => {
  const { milestones, loading, addMilestone, updateMilestone, deleteMilestone } = useProjectMilestones(reportId);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: '',
    evidence_url: '',
    notes: '',
    completion_percentage: 0,
    status: 'pending',
  });

  const resetForm = () => {
    setFormData({ title: '', description: '', target_date: '', evidence_url: '', notes: '', completion_percentage: 0, status: 'pending' });
    setEditingMilestone(null);
  };

  const handleAdd = async () => {
    if (!formData.title.trim()) return;
    await addMilestone({
      title: formData.title,
      description: formData.description || undefined,
      target_date: formData.target_date || undefined,
      evidence_url: formData.evidence_url || undefined,
      notes: formData.notes || undefined,
    });
    resetForm();
    setShowAddDialog(false);
  };

  const handleUpdate = async () => {
    if (!editingMilestone) return;
    await updateMilestone(editingMilestone.id, {
      title: formData.title,
      description: formData.description || null,
      target_date: formData.target_date || null,
      evidence_url: formData.evidence_url || null,
      notes: formData.notes || null,
      completion_percentage: formData.completion_percentage,
      status: formData.completion_percentage >= 100 ? 'completed' : formData.completion_percentage > 0 ? 'in_progress' : 'pending',
    });
    resetForm();
    setEditingMilestone(null);
  };

  const openEdit = (m: ProjectMilestone) => {
    setEditingMilestone(m);
    setFormData({
      title: m.title,
      description: m.description || '',
      target_date: m.target_date || '',
      evidence_url: m.evidence_url || '',
      notes: m.notes || '',
      completion_percentage: m.completion_percentage,
      status: m.status,
    });
  };

  const overallProgress = milestones.length > 0
    ? Math.round(milestones.reduce((sum, m) => sum + m.completion_percentage, 0) / milestones.length)
    : 0;

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading milestones...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Milestones</h4>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={overallProgress} className="w-32 h-2" />
            <span className="text-xs text-muted-foreground">{overallProgress}% overall</span>
          </div>
        </div>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-3 w-3 mr-1" /> Add Milestone
          </Button>
        )}
      </div>

      {milestones.length === 0 ? (
        <p className="text-sm text-muted-foreground">No milestones yet. {canEdit ? 'Add one to start tracking progress.' : ''}</p>
      ) : (
        <div className="space-y-2">
          {milestones.map((m) => {
            const config = statusConfig[m.status] || statusConfig.pending;
            const Icon = config.icon;
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Icon className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{m.title}</span>
                    <Badge variant="secondary" className={`text-xs ${config.color}`}>{config.label}</Badge>
                  </div>
                  {m.target_date && (
                    <span className="text-xs text-muted-foreground">Due: {format(new Date(m.target_date), 'MMM d, yyyy')}</span>
                  )}
                  <Progress value={m.completion_percentage} className="w-full h-1.5 mt-1" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{m.completion_percentage}%</span>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(m)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMilestone(m.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Milestone Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowAddDialog(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Phase 1 - Site Preparation" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="What needs to be accomplished" />
            </div>
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Input type="date" value={formData.target_date} onChange={(e) => setFormData({ ...formData, target_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Evidence URL</Label>
              <Input value={formData.evidence_url} onChange={(e) => setFormData({ ...formData, evidence_url: e.target.value })} placeholder="Link to evidence document or photo" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setShowAddDialog(false); }}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!formData.title.trim()}>Add Milestone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Milestone Dialog */}
      <Dialog open={!!editingMilestone} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Milestone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Completion: {formData.completion_percentage}%</Label>
              <Slider
                value={[formData.completion_percentage]}
                onValueChange={([val]) => setFormData({ ...formData, completion_percentage: val })}
                max={100}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Input type="date" value={formData.target_date} onChange={(e) => setFormData({ ...formData, target_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Evidence URL</Label>
              <Input value={formData.evidence_url} onChange={(e) => setFormData({ ...formData, evidence_url: e.target.value })} placeholder="Link to evidence" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!formData.title.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectMilestones;
