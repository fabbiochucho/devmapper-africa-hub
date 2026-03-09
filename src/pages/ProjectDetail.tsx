import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import CitizenFeedbackPanel from "@/components/pm/CitizenFeedbackPanel";
import { sdgGoals } from "@/lib/constants";
import {
  MapPin, Calendar, Target, Users, DollarSign, CheckCircle2, Clock,
  Shield, ArrowLeft, FileText, Star, AlertTriangle, Eye
} from "lucide-react";

const VERIFICATION_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  self_report: { label: "Self Report", icon: <FileText className="h-3 w-3" /> },
  citizen: { label: "Community Verified", icon: <Users className="h-3 w-3" /> },
  ngo: { label: "NGO Verified", icon: <Shield className="h-3 w-3" /> },
  government: { label: "Government Verified", icon: <Shield className="h-3 w-3" /> },
  platform_audit: { label: "Platform Audited", icon: <CheckCircle2 className="h-3 w-3" /> },
};

const STATUS_STEPS = [
  { key: "planned", label: "Planned" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "verified", label: "Verified" },
];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("reports").select("*").eq("id", id).single(),
      supabase.from("project_milestones").select("*").eq("report_id", id).order("target_date"),
      supabase.from("project_updates").select("*").eq("report_id", id).order("created_at", { ascending: false }).limit(10),
      supabase.from("project_verifications").select("*").eq("report_id", id).order("created_at"),
      supabase.from("citizen_project_feedback").select("*").eq("report_id", id).order("created_at", { ascending: false }).limit(20),
    ]).then(([r, m, u, v, f]) => {
      if (r.data) setReport(r.data);
      if (m.data) setMilestones(m.data);
      if (u.data) setUpdates(u.data);
      if (v.data) setVerifications(v.data);
      if (f.data) setFeedback(f.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
        <Link to="/"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Back to Home</Button></Link>
      </div>
    );
  }

  const sdg = sdgGoals.find(g => g.value === String(report.sdg_goal));
  const statusIndex = STATUS_STEPS.findIndex(s => s.key === report.project_status);
  const progressPercent = statusIndex >= 0 ? ((statusIndex + 1) / STATUS_STEPS.length) * 100 : 25;

  const avgRating = feedback.filter(f => f.rating).reduce((sum, f, _, arr) => sum + f.rating / arr.length, 0);
  const issueCount = feedback.filter(f => f.is_issue_report).length;

  const getVerificationStatus = (level: string) => {
    const v = verifications.find((vr: any) => vr.verification_level === level);
    return v?.status || "pending";
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/analytics">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{report.title}</h1>
          <p className="text-muted-foreground">{report.description}</p>
        </div>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {report.location && (
          <Card>
            <CardContent className="pt-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium">{report.location}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {sdg && (
          <Card>
            <CardContent className="pt-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">SDG Goal</p>
                <p className="text-sm font-medium">SDG {report.sdg_goal}: {sdg.title}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {report.beneficiaries > 0 && (
          <Card>
            <CardContent className="pt-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Beneficiaries</p>
                <p className="text-sm font-medium">{report.beneficiaries?.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {report.cost > 0 && (
          <Card>
            <CardContent className="pt-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="text-sm font-medium">${report.cost?.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Progress Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 mb-3">
            {STATUS_STEPS.map((step, i) => {
              const isComplete = i <= statusIndex;
              const isCurrent = i === statusIndex;
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isComplete ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}>
                    {isComplete ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`text-xs ${isComplete ? "font-medium" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(VERIFICATION_LABELS).map(([key, config]) => {
              const status = getVerificationStatus(key);
              return (
                <div key={key} className={`p-3 rounded-lg text-center ${
                  status === "approved" ? "bg-green-500/10" :
                  status === "submitted" ? "bg-primary/10" :
                  "bg-muted/50"
                }`}>
                  <div className="flex justify-center mb-1">
                    {status === "approved" ? <CheckCircle2 className="h-5 w-5 text-green-600" /> :
                     status === "submitted" ? <Clock className="h-5 w-5 text-primary" /> :
                     <span className="h-5 w-5 text-muted-foreground">{config.icon}</span>}
                  </div>
                  <p className="text-xs font-medium">{config.label}</p>
                  <Badge variant="outline" className="text-xs mt-1 capitalize">{status}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      {milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {milestones.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3">
                  {m.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${m.completed ? "line-through text-muted-foreground" : ""}`}>
                      {m.title}
                    </p>
                    {m.target_date && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{new Date(m.target_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Updates */}
      {updates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {updates.map((u: any) => (
                <div key={u.id} className="border-l-2 border-primary/30 pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline">{u.progress_percent}% complete</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{u.update_text}</p>
                  {u.evidence_url && (
                    <a href={u.evidence_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline mt-1 inline-block">
                      <Eye className="h-3 w-3 inline mr-1" />View evidence
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Community Feedback Summary */}
      {feedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />Community Feedback
              <Badge variant="secondary" className="ml-auto">{feedback.length} responses</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-lg font-bold">{avgRating ? avgRating.toFixed(1) : "—"}</span>
                </div>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold">{feedback.length}</span>
                <p className="text-xs text-muted-foreground">Feedbacks</p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-destructive">{issueCount}</span>
                <p className="text-xs text-muted-foreground">Issues</p>
              </div>
            </div>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {feedback.slice(0, 5).map((f: any) => (
                  <div key={f.id} className={`p-3 rounded-lg text-sm ${f.is_issue_report ? "bg-destructive/5" : "bg-muted/50"}`}>
                    {f.rating && (
                      <div className="flex gap-0.5 mb-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < f.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                    )}
                    {f.comment && <p>{f.comment}</p>}
                    {f.is_issue_report && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        <AlertTriangle className="h-3 w-3 mr-1" />{f.issue_severity || "Issue"} reported
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(f.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Citizen Feedback Panel (for logged-in users) */}
      {user && id && (
        <CitizenFeedbackPanel reportId={id} />
      )}
    </div>
  );
}
