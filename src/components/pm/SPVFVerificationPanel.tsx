import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { toast } from 'sonner';
import {
  Shield, CheckCircle2, XCircle, Clock, Award, Upload, FileText,
  TrendingUp, BarChart3, AlertTriangle, ChevronRight, Star
} from 'lucide-react';
import {
  VERIFICATION_STAGES,
  DIMENSION_DESCRIPTIONS,
  RATING_CONFIG,
  EVIDENCE_TYPE_WEIGHTS,
  computeFullSIS,
  type SISComponents,
  type SISResult,
  type CertificationRating,
  type VerificationStageKey,
} from '@/lib/spvf-engine';

interface SPVFVerificationPanelProps {
  reportId: string;
  isOwner: boolean;
}

const STAGE_STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-5 w-5 text-primary" />,
  in_progress: <Clock className="h-5 w-5 text-yellow-500" />,
  failed: <XCircle className="h-5 w-5 text-destructive" />,
  pending: <Clock className="h-5 w-5 text-muted-foreground" />,
};

export default function SPVFVerificationPanel({ reportId, isOwner }: SPVFVerificationPanelProps) {
  const { user } = useAuth();
  const { hasRole } = useUserRole();
  const [workflowStages, setWorkflowStages] = useState<any[]>([]);
  const [scores, setScores] = useState<any>(null);
  const [evidenceItems, setEvidenceItems] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Scoring form state
  const [scoreForm, setScoreForm] = useState<SISComponents>({
    sdgAlignmentScore: 0,
    evidenceStrengthScore: 0,
    implementationIntegrityScore: 0,
    outputDeliveryScore: 0,
    outcomeAchievementScore: 0,
    sustainabilityScore: 0,
    communityValidationScore: 0,
  });

  // Stage update form
  const [stageNotes, setStageNotes] = useState('');

  useEffect(() => {
    if (reportId) fetchAll();
  }, [reportId]);

  const fetchAll = async () => {
    setLoading(true);
    const [wfRes, scRes, evRes, vrRes, crRes] = await Promise.all([
      supabase.from('verification_workflow_stages').select('*').eq('report_id', reportId).order('created_at'),
      supabase.from('verification_scores').select('*').eq('report_id', reportId).single(),
      supabase.from('evidence_items').select('*').eq('report_id', reportId).order('created_at', { ascending: false }),
      supabase.from('project_verifications').select('*').eq('report_id', reportId).order('created_at'),
      supabase.from('project_certifications').select('*').eq('report_id', reportId).order('issued_at', { ascending: false }),
    ]);

    if (wfRes.data) setWorkflowStages(wfRes.data);
    if (scRes.data) {
      setScores(scRes.data);
      setScoreForm({
        sdgAlignmentScore: Number(scRes.data.sdg_alignment_score) || 0,
        evidenceStrengthScore: Number(scRes.data.evidence_strength_score) || 0,
        implementationIntegrityScore: Number(scRes.data.implementation_integrity_score) || 0,
        outputDeliveryScore: Number(scRes.data.output_delivery_score) || 0,
        outcomeAchievementScore: Number(scRes.data.outcome_achievement_score) || 0,
        sustainabilityScore: Number(scRes.data.sustainability_score) || 0,
        communityValidationScore: Number(scRes.data.community_validation_score) || 0,
      });
    }
    if (evRes.data) setEvidenceItems(evRes.data);
    if (vrRes.data) setVerifications(vrRes.data);
    if (crRes.data) setCertifications(crRes.data);
    setLoading(false);
  };

  const sisResult: SISResult = computeFullSIS(scoreForm);
  const isVerifier = hasRole('admin') || hasRole('platform_admin') || hasRole('government_official') || hasRole('ngo_member');

  const updateStageStatus = async (stage: string, status: string) => {
    const now = new Date().toISOString();
    const updates: any = { status, updated_at: now, notes: stageNotes || null };
    if (status === 'in_progress') updates.started_at = now;
    if (status === 'completed') updates.completed_at = now;

    const { error } = await supabase
      .from('verification_workflow_stages')
      .update(updates)
      .eq('report_id', reportId)
      .eq('stage', stage);

    if (error) {
      toast.error('Failed to update stage');
    } else {
      toast.success(`Stage "${stage}" updated to ${status}`);
      setStageNotes('');
      fetchAll();
    }
  };

  const saveScores = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('verification_scores')
      .update({
        sdg_alignment_score: scoreForm.sdgAlignmentScore,
        evidence_strength_score: scoreForm.evidenceStrengthScore,
        implementation_integrity_score: scoreForm.implementationIntegrityScore,
        output_delivery_score: scoreForm.outputDeliveryScore,
        outcome_achievement_score: scoreForm.outcomeAchievementScore,
        sustainability_score: scoreForm.sustainabilityScore,
        community_validation_score: scoreForm.communityValidationScore,
        scored_by: user.id,
        scored_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('report_id', reportId);

    if (error) {
      toast.error('Failed to save scores');
    } else {
      toast.success(`SDG Impact Score saved: ${sisResult.totalSIS} (${sisResult.ratingLabel})`);
      fetchAll();
    }
  };

  const ratingBadge = (rating: CertificationRating) => {
    const config = RATING_CONFIG[rating];
    return (
      <Badge className="text-xs font-semibold" style={{ backgroundColor: config.color, color: '#fff' }}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return <div className="space-y-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Loading SPVF data...</CardContent></Card></div>;
  }

  const completedStages = workflowStages.filter(s => s.status === 'completed').length;
  const totalStages = 7;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SDG Project Verification Framework (SPVF)
          </CardTitle>
          <CardDescription>
            SDG-PVS 1000 — 7-stage verification process with SDG Impact Score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SIS Score */}
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold" style={{ color: sisResult.ratingColor }}>
                  {sisResult.totalSIS}
                </div>
                <p className="text-sm text-muted-foreground mt-1">SDG Impact Score</p>
                <div className="mt-2">{ratingBadge(sisResult.rating)}</div>
              </CardContent>
            </Card>

            {/* Verification Progress */}
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold">{completedStages}/{totalStages}</div>
                <p className="text-sm text-muted-foreground mt-1">Stages Completed</p>
                <Progress value={(completedStages / totalStages) * 100} className="mt-3" />
              </CardContent>
            </Card>

            {/* Evidence Count */}
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold">{evidenceItems.length}</div>
                <p className="text-sm text-muted-foreground mt-1">Evidence Items</p>
                <p className="text-xs text-muted-foreground mt-2">Min. 3 per claim required</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stages">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stages">7-Stage Workflow</TabsTrigger>
          <TabsTrigger value="scorecard">SIS Scorecard</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="certification">Certification</TabsTrigger>
        </TabsList>

        {/* TAB 1: 7-Stage Verification Workflow */}
        <TabsContent value="stages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">7-Stage SDG Project Verification Process</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {VERIFICATION_STAGES.map((stage, idx) => {
                  const wfStage = workflowStages.find(s => s.stage === stage.key);
                  const status = wfStage?.status || 'pending';
                  return (
                    <AccordionItem key={stage.key} value={stage.key}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          {STAGE_STATUS_ICONS[status]}
                          <div>
                            <p className="font-medium text-sm">{stage.label}</p>
                            <p className="text-xs text-muted-foreground">{status.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pl-8">
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                        <div>
                          <p className="text-xs font-semibold mb-1">Verification Checks:</p>
                          <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                            {stage.checks.map((check, i) => (
                              <li key={i}>{check}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Stage evidence */}
                        {evidenceItems.filter(e => e.verification_stage === stage.key).length > 0 && (
                          <div>
                            <p className="text-xs font-semibold mb-1">Evidence ({evidenceItems.filter(e => e.verification_stage === stage.key).length}):</p>
                            {evidenceItems.filter(e => e.verification_stage === stage.key).map(ev => (
                              <div key={ev.id} className="flex items-center gap-2 text-xs border rounded p-2 mb-1">
                                <FileText className="h-3 w-3" />
                                <span>{ev.title}</span>
                                <Badge variant="outline" className="text-[10px]">{ev.evidence_type}</Badge>
                                <Badge variant={ev.verification_status === 'verified' ? 'default' : 'secondary'} className="text-[10px] ml-auto">
                                  {ev.verification_status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Stage actions for verifiers */}
                        {(isVerifier || isOwner) && status !== 'completed' && (
                          <div className="space-y-2 border-t pt-3">
                            <Textarea
                              placeholder="Verification notes..."
                              value={stageNotes}
                              onChange={e => setStageNotes(e.target.value)}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              {status === 'pending' && (
                                <Button size="sm" variant="outline" onClick={() => updateStageStatus(stage.key, 'in_progress')}>
                                  Start Verification
                                </Button>
                              )}
                              {status === 'in_progress' && (
                                <>
                                  <Button size="sm" onClick={() => updateStageStatus(stage.key, 'completed')}>
                                    <CheckCircle2 className="mr-1 h-3 w-3" /> Mark Complete
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => updateStageStatus(stage.key, 'failed')}>
                                    <XCircle className="mr-1 h-3 w-3" /> Flag Issue
                                  </Button>
                                </>
                              )}
                              {status === 'failed' && (
                                <Button size="sm" variant="outline" onClick={() => updateStageStatus(stage.key, 'in_progress')}>
                                  Restart
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: SIS Scorecard */}
        <TabsContent value="scorecard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />SDG Impact Score (SIS) Scorecard
              </CardTitle>
              <CardDescription>
                Score each dimension from 0–100. The weighted total determines the certification rating.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(DIMENSION_DESCRIPTIONS).map(([key, dim]) => {
                const scoreKey = `${key}Score` as keyof SISComponents;
                const value = scoreForm[scoreKey];
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <Label className="text-sm font-semibold">{dim.label}</Label>
                        <span className="text-xs text-muted-foreground ml-2">({dim.weight})</span>
                      </div>
                      <span className="text-lg font-bold">{value}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{dim.description}</p>
                    <Slider
                      value={[value]}
                      max={100}
                      step={1}
                      disabled={!isVerifier}
                      onValueChange={([val]) => setScoreForm(prev => ({ ...prev, [scoreKey]: val }))}
                    />
                    <ul className="list-disc pl-5 text-[11px] text-muted-foreground">
                      {dim.factors.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                );
              })}

              {/* Total SIS */}
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Total SDG Impact Score</p>
                      <p className="text-xs text-muted-foreground">Weighted sum of all dimensions</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold" style={{ color: sisResult.ratingColor }}>
                        {sisResult.totalSIS}
                      </div>
                      {ratingBadge(sisResult.rating)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rating scale reference */}
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {Object.entries(RATING_CONFIG).map(([key, cfg]) => (
                  <div key={key} className="border rounded p-2">
                    <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: cfg.color }} />
                    <p className="font-semibold">{cfg.label}</p>
                  </div>
                ))}
              </div>

              {isVerifier && (
                <Button onClick={saveScores} className="w-full">
                  <Star className="mr-2 h-4 w-4" /> Save SIS Score
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Evidence */}
        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />Evidence Repository
              </CardTitle>
              <CardDescription>
                Projects must submit at least 3 forms of evidence for each claim (Documentary, Physical, Testimonial).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {evidenceItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No evidence items submitted yet.</p>
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evidenceItems.map(ev => (
                        <TableRow key={ev.id}>
                          <TableCell className="font-medium text-sm">{ev.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{ev.evidence_type}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{ev.verification_stage || '—'}</TableCell>
                          <TableCell>
                            <Badge variant={ev.verification_status === 'verified' ? 'default' : ev.verification_status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs">
                              {ev.verification_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(ev.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}

              {/* Evidence type weight reference */}
              <div className="mt-4 border-t pt-4">
                <p className="text-xs font-semibold mb-2">Evidence Type Weights (for Evidence Strength scoring):</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {Object.entries(EVIDENCE_TYPE_WEIGHTS).map(([type, weight]) => (
                    <div key={type} className="flex justify-between border rounded p-2">
                      <span className="capitalize">{type}</span>
                      <span className="font-semibold">{weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Certification */}
        <TabsContent value="certification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4" />SDG Verification Certification
              </CardTitle>
              <CardDescription>
                Certification issued upon completion of the 7-stage verification process.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {certifications.length > 0 ? (
                <div className="space-y-3">
                  {certifications.map(cert => (
                    <Card key={cert.id} className="border-2">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{RATING_CONFIG[cert.rating as CertificationRating]?.label || cert.rating}</p>
                            <p className="text-xs text-muted-foreground">Certificate: {cert.certificate_number || 'N/A'}</p>
                            {cert.certification_body && (
                              <p className="text-xs text-muted-foreground">Issued by: {cert.certification_body}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Issued: {new Date(cert.issued_at).toLocaleDateString()}
                              {cert.expires_at && ` • Expires: ${new Date(cert.expires_at).toLocaleDateString()}`}
                            </p>
                          </div>
                          <Badge variant={cert.status === 'active' ? 'default' : 'destructive'}>
                            {cert.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No certification issued yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete all 7 verification stages and achieve a minimum SIS of 60 to qualify.
                  </p>
                </div>
              )}

              {/* Certification levels reference */}
              <div className="mt-6 border-t pt-4">
                <p className="text-xs font-semibold mb-2">Certification Levels:</p>
                <div className="space-y-2">
                  {Object.entries(RATING_CONFIG).map(([key, cfg]) => (
                    <div key={key} className="flex items-start gap-3 text-xs">
                      <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                      <div>
                        <span className="font-semibold">{cfg.label}</span>
                        <span className="text-muted-foreground ml-2">{cfg.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
