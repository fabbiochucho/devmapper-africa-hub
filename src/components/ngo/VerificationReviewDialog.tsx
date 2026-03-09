import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapPin, Target, Calendar, FileText, Image, CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface VerificationReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    title: string;
    description: string;
    sdg_goal: number;
    location: string;
    project_status: string;
    submitted_at?: string;
    user_id: string;
  } | null;
  userId: string;
  onVerified: () => void;
}

export default function VerificationReviewDialog({
  open,
  onOpenChange,
  project,
  userId,
  onVerified,
}: VerificationReviewDialogProps) {
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'needs_revision'>('approved');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  useEffect(() => {
    if (project && open) {
      setLoadingEvidence(true);
      // Fetch evidence items for this project
      supabase
        .from('evidence_items')
        .select('*')
        .eq('report_id', project.id)
        .then(({ data }) => {
          setEvidence(data || []);
          setLoadingEvidence(false);
        });
    }
  }, [project, open]);

  const handleSubmit = async () => {
    if (!project || !comments.trim()) {
      toast.error('Please provide comments for your review');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('project_verifications').insert({
        report_id: project.id,
        verifier_id: userId,
        verification_level: 'ngo',
        status: decision,
        comments: comments.trim(),
      } as any);

      if (error) throw error;

      // Create notification for project owner
      await supabase.from('notifications').insert({
        user_id: project.user_id,
        type: decision === 'approved' ? 'success' : decision === 'rejected' ? 'warning' : 'info',
        title: `Project ${decision === 'approved' ? 'Verified' : decision === 'rejected' ? 'Verification Rejected' : 'Needs Revision'}`,
        message: `Your project "${project.title}" has been reviewed by an NGO. ${comments}`,
        link: `/project-management?project=${project.id}`,
      });

      toast.success('Verification submitted successfully');
      setComments('');
      setDecision('approved');
      onVerified();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to submit verification: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Project for Verification</DialogTitle>
          <DialogDescription>
            Review the project details and evidence before making a verification decision.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Project Details</TabsTrigger>
            <TabsTrigger value="evidence">Evidence ({evidence.length})</TabsTrigger>
            <TabsTrigger value="decision">Decision</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{project.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    SDG {project.sdg_goal}
                  </Badge>
                  {project.location && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {project.location}
                    </Badge>
                  )}
                  <Badge variant="secondary">{project.project_status}</Badge>
                  {project.submitted_at && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.submitted_at).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Verification Checklist</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Project description is clear and specific
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  SDG alignment is appropriate
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  Evidence should be reviewed
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  Location details verified
                </li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="evidence" className="space-y-4 mt-4">
            {loadingEvidence ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
              </div>
            ) : evidence.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No evidence documents uploaded yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Consider requesting evidence before approving.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {evidence.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.evidence_type === 'image' ? (
                          <Image className="h-5 w-5 text-blue-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-orange-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.evidence_type}</p>
                        </div>
                      </div>
                      {item.file_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="decision" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Verification Decision</Label>
              <RadioGroup value={decision} onValueChange={(v) => setDecision(v as any)}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="approved" id="approved" />
                  <Label htmlFor="approved" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">Approve</p>
                      <p className="text-xs text-muted-foreground">Project meets verification standards</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="needs_revision" id="needs_revision" />
                  <Label htmlFor="needs_revision" className="flex items-center gap-2 cursor-pointer flex-1">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="font-medium">Needs Revision</p>
                      <p className="text-xs text-muted-foreground">Additional information or corrections needed</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="rejected" id="rejected" />
                  <Label htmlFor="rejected" className="flex items-center gap-2 cursor-pointer flex-1">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="font-medium">Reject</p>
                      <p className="text-xs text-muted-foreground">Project does not meet verification criteria</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Review Comments *</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Provide detailed feedback for the project owner..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Your comments will be shared with the project owner.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !comments.trim()}
            className={
              decision === 'approved'
                ? 'bg-green-600 hover:bg-green-700'
                : decision === 'rejected'
                ? 'bg-red-600 hover:bg-red-700'
                : ''
            }
          >
            {submitting ? 'Submitting...' : `Submit ${decision === 'approved' ? 'Approval' : decision === 'rejected' ? 'Rejection' : 'Review'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
