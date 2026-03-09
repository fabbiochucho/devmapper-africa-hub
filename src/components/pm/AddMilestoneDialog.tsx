import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { sdgGoals } from '@/lib/constants';

interface AddMilestoneDialogProps {
  reportId: string;
  onAdded: () => void;
}

export default function AddMilestoneDialog({ reportId, onAdded }: AddMilestoneDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [sdgIndicators, setSdgIndicators] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleSdg = (goal: number) => {
    setSdgIndicators(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from('project_milestones').insert({
      report_id: reportId,
      title: title.trim(),
      description: description.trim() || null,
      target_date: targetDate || null,
      sdg_indicators: sdgIndicators,
      completion_percentage: 0,
      status: 'pending',
      created_by: user.id,
    });

    if (error) {
      toast.error('Failed to create milestone');
    } else {
      toast.success('Milestone created');
      setTitle('');
      setDescription('');
      setTargetDate('');
      setSdgIndicators([]);
      setOpen(false);
      onAdded();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="mr-1 h-3 w-3" />Add Milestone</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create Milestone</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Feasibility study complete" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this milestone represent?" />
          </div>
          <div>
            <Label>Target Date</Label>
            <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">Linked SDG Goals</Label>
            <div className="grid grid-cols-6 gap-1.5">
              {sdgGoals.map(goal => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleSdg(goal.id)}
                  className={`text-xs p-1.5 rounded border text-center transition-colors ${
                    sdgIndicators.includes(goal.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                  }`}
                  title={goal.name}
                >
                  {goal.id}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={!title.trim() || saving} className="w-full">
            {saving ? 'Creating...' : 'Create Milestone'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
