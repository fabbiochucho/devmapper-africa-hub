import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

interface SubmitVerificationDialogProps {
  reportId: string;
  onSubmitted: () => void;
}

const VERIFICATION_LEVELS = [
  { key: 'self_report', label: 'Self Report', description: 'Project owner submits progress updates' },
  { key: 'citizen', label: 'Citizen Verification', description: 'Community members confirm progress' },
  { key: 'ngo', label: 'NGO Verification', description: 'NGO validates project data' },
  { key: 'government', label: 'Government Verification', description: 'Government or institutional verification' },
  { key: 'platform_audit', label: 'Platform Audit', description: 'DevMapper admin approval' },
];

export default function SubmitVerificationDialog({ reportId, onSubmitted }: SubmitVerificationDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState('');
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!level || !user) return;
    setSaving(true);

    const { error } = await supabase.from('project_verifications').insert({
      report_id: reportId,
      verifier_id: user.id,
      verification_level: level,
      status: 'pending',
      comments: comments.trim() || null,
    });

    if (error) {
      toast.error('Failed to submit verification request');
    } else {
      toast.success('Verification request submitted');
      setLevel('');
      setComments('');
      setOpen(false);
      onSubmitted();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Shield className="mr-1 h-3 w-3" />Request Verification</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Submit Verification Request</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Verification Level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent>
                {VERIFICATION_LEVELS.map(v => (
                  <SelectItem key={v.key} value={v.key}>
                    <div>
                      <span className="font-medium">{v.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">— {v.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Comments / Evidence Summary</Label>
            <Textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Describe the evidence supporting this verification..." />
          </div>
          <Button onClick={handleSubmit} disabled={!level || saving} className="w-full">
            {saving ? 'Submitting...' : 'Submit Verification Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
