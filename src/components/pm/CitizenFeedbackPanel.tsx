import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MessageSquare, Camera, AlertTriangle, Star, ThumbsUp, Upload, Loader2 } from 'lucide-react';

interface CitizenFeedbackPanelProps {
  reportId: string;
}

interface Feedback {
  id: string;
  feedback_type: string;
  rating: number | null;
  comment: string | null;
  photo_url: string | null;
  progress_estimate: number | null;
  is_issue_report: boolean;
  issue_severity: string | null;
  status: string;
  created_at: string;
}

export default function CitizenFeedbackPanel({ reportId }: CitizenFeedbackPanelProps) {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState<number>(3);
  const [progressEstimate, setProgressEstimate] = useState<number>(50);
  const [isIssue, setIsIssue] = useState(false);
  const [severity, setSeverity] = useState('low');
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFeedback();
  }, [reportId]);

  const fetchFeedback = async () => {
    const { data } = await supabase
      .from('citizen_project_feedback')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false });
    setFeedbacks((data as Feedback[]) || []);
    setLoading(false);
  };

  const submitFeedback = async () => {
    if (!user || !comment.trim()) return;
    setSaving(true);

    const { error } = await supabase.from('citizen_project_feedback').insert({
      report_id: reportId,
      user_id: user.id,
      feedback_type: isIssue ? 'issue_report' : 'progress_confirmation',
      rating,
      comment: comment.trim(),
      photo_url: photoUrl.trim() || null,
      progress_estimate: progressEstimate,
      is_issue_report: isIssue,
      issue_severity: isIssue ? severity : null,
    });

    if (error) {
      toast.error('Failed to submit feedback');
    } else {
      toast.success('Feedback submitted — thank you!');
      setComment('');
      setRating(3);
      setProgressEstimate(50);
      setIsIssue(false);
      setPhotoUrl('');
      setShowForm(false);
      fetchFeedback();
    }
    setSaving(false);
  };

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((s, f) => s + (f.rating || 0), 0) / feedbacks.filter(f => f.rating).length).toFixed(1)
    : 'N/A';

  const issueCount = feedbacks.filter(f => f.is_issue_report).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Community Feedback ({feedbacks.length})
          </CardTitle>
          {user && (
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Add Feedback'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{avgRating}</span>
            <span className="text-muted-foreground">avg rating</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4 text-primary" />
            <span className="font-medium">{feedbacks.filter(f => !f.is_issue_report).length}</span>
            <span className="text-muted-foreground">confirmations</span>
          </div>
          {issueCount > 0 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="font-medium">{issueCount}</span>
              <span className="text-muted-foreground">issues</span>
            </div>
          )}
        </div>

        {/* Feedback form */}
        {showForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div>
              <Label>Your Comment</Label>
              <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your observation about this project..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rating (1-5)</Label>
                <Slider value={[rating]} min={1} max={5} step={1} onValueChange={([v]) => setRating(v)} />
                <p className="text-xs text-muted-foreground mt-1">{rating}/5 stars</p>
              </div>
              <div>
                <Label>Progress Estimate</Label>
                <Slider value={[progressEstimate]} min={0} max={100} step={5} onValueChange={([v]) => setProgressEstimate(v)} />
                <p className="text-xs text-muted-foreground mt-1">{progressEstimate}% complete</p>
              </div>
            </div>

            <div>
              <Label>Photo URL (optional)</Label>
              <Input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isIssue} onCheckedChange={setIsIssue} />
              <Label>Report an issue</Label>
            </div>

            {isIssue && (
              <div>
                <Label>Issue Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button onClick={submitFeedback} disabled={!comment.trim() || saving} className="w-full">
              {saving ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        )}

        {/* Feedback list */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading feedback...</p>
        ) : feedbacks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No community feedback yet. Be the first!</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {feedbacks.map(fb => (
              <div key={fb.id} className="border rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {fb.is_issue_report ? (
                      <Badge variant="destructive" className="text-[10px]">
                        <AlertTriangle className="h-3 w-3 mr-0.5" />Issue — {fb.issue_severity}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        <ThumbsUp className="h-3 w-3 mr-0.5" />Confirmation
                      </Badge>
                    )}
                    {fb.rating && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Star className="h-3 w-3 text-yellow-500" />{fb.rating}/5
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(fb.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm">{fb.comment}</p>
                {fb.progress_estimate !== null && (
                  <p className="text-xs text-muted-foreground">Estimated progress: {fb.progress_estimate}%</p>
                )}
                {fb.photo_url && (
                  <a href={fb.photo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline flex items-center gap-1">
                    <Camera className="h-3 w-3" />View photo
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
