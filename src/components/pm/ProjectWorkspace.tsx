import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Calendar, Target, Users, DollarSign, CheckCircle2 } from "lucide-react";
import AddMilestoneDialog from "./AddMilestoneDialog";
import SubmitVerificationDialog from "./SubmitVerificationDialog";
import CitizenFeedbackPanel from "./CitizenFeedbackPanel";
import ImpactScorecard from "@/components/scoring/ImpactScorecard";

interface ProjectWorkspaceProps {
  reportId: string;
  report: any;
}

const LIFECYCLE_STEPS = [
  { key: "planning", label: "Planning" },
  { key: "approved", label: "Approved" },
  { key: "active", label: "Active" },
  { key: "delayed", label: "Delayed" },
  { key: "completed", label: "Completed" },
  { key: "verified", label: "Verified" },
];

const STATUS_ORDER: Record<string, number> = {
  planning: 0, approved: 1, active: 2, delayed: 2, completed: 3, "on-hold": 2, cancelled: -1, verified: 4,
};

export default function ProjectWorkspace({ reportId, report }: ProjectWorkspaceProps) {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    if (!reportId) return;
    Promise.all([
      supabase.from("project_milestones").select("*").eq("report_id", reportId).order("target_date"),
      supabase.from("project_verifications").select("*").eq("report_id", reportId).order("created_at"),
      supabase.from("project_budgets").select("*").eq("report_id", reportId),
      supabase.from("project_updates").select("*").eq("report_id", reportId).order("created_at", { ascending: false }).limit(5),
    ]).then(([m, v, b, u]) => {
      if (m.data) setMilestones(m.data);
      if (v.data) setVerifications(v.data);
      if (b.data) setBudgets(b.data);
      if (u.data) setUpdates(u.data);
    });
  }, [reportId]);

  if (!report) return null;

  const currentStep = STATUS_ORDER[report.project_status] ?? 0;
  const totalBudget = budgets.reduce((s, b) => s + Number(b.budget_allocated || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + Number(b.budget_spent || 0), 0);
  const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const verificationLevels = [
    { key: "self_report", label: "Self Report" },
    { key: "citizen", label: "Citizen Verified" },
    { key: "ngo", label: "NGO Verified" },
    { key: "government", label: "Government Verified" },
    { key: "platform_audit", label: "Platform Audited" },
  ];

  const getVerificationStatus = (level: string) => {
    const v = verifications.find((vr: any) => vr.verification_level === level);
    if (!v) return "pending";
    return v.status;
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">{report.title}</h2>
              <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {report.location && (
                  <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" />{report.location}</Badge>
                )}
                {report.sdg_goal && (
                  <Badge variant="secondary"><Target className="h-3 w-3 mr-1" />SDG {report.sdg_goal}</Badge>
                )}
                {report.start_date && (
                  <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />{report.start_date}</Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className="text-sm">{report.project_status}</Badge>
              {report.beneficiaries && (
                <span className="text-sm text-muted-foreground"><Users className="inline h-3 w-3 mr-1" />{report.beneficiaries.toLocaleString()} beneficiaries</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Lifecycle */}
      <Card>
        <CardHeader><CardTitle className="text-base">Project Lifecycle</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {LIFECYCLE_STEPS.map((step, i) => {
              const stepIdx = STATUS_ORDER[step.key] ?? i;
              const isActive = step.key === report.project_status;
              const isDone = currentStep > stepIdx;
              return (
                <div key={step.key} className="flex items-center gap-1">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    isActive ? "bg-primary text-primary-foreground" :
                    isDone ? "bg-primary/20 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {isDone && <CheckCircle2 className="h-3 w-3" />}
                    {step.label}
                  </div>
                  {i < LIFECYCLE_STEPS.length - 1 && <div className={`w-6 h-0.5 ${isDone ? "bg-primary" : "bg-muted"}`} />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Budget Summary */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />Budget</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No budget entries yet.</p>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span>Allocated: <strong>${totalBudget.toLocaleString()}</strong></span>
                  <span>Spent: <strong>${totalSpent.toLocaleString()}</strong></span>
                </div>
                <Progress value={budgetPct} className="h-2" />
                <p className="text-xs text-muted-foreground">{budgetPct}% utilized</p>
                {budgets.map((b: any) => (
                  <div key={b.id} className="text-xs border rounded p-2 space-y-1">
                    {b.funding_source && <p><strong>Source:</strong> {b.funding_source}</p>}
                    {b.donor_organization && <p><strong>Donor:</strong> {b.donor_organization}</p>}
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Verification Status</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {verificationLevels.map(level => {
              const status = getVerificationStatus(level.key);
              return (
                <div key={level.key} className="flex items-center justify-between text-sm">
                  <span>{level.label}</span>
                  <Badge variant={status === "approved" ? "default" : status === "pending" ? "outline" : "secondary"}>
                    {status === "approved" ? "✔ Verified" : status === "rejected" ? "✘ Rejected" : "Pending"}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Milestones</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {milestones.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3">
                <CheckCircle2 className={`h-5 w-5 shrink-0 ${m.status === "completed" ? "text-green-500" : "text-muted-foreground"}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{m.title}</p>
                  {m.target_date && <p className="text-xs text-muted-foreground">Target: {m.target_date}</p>}
                </div>
                <Progress value={m.completion_percentage} className="w-20 h-2" />
                <span className="text-xs text-muted-foreground w-8">{m.completion_percentage}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Updates */}
      {updates.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Progress Updates</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {updates.map((u: any) => (
              <div key={u.id} className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{u.progress_percent}% progress</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm">{u.update_text}</p>
                {u.evidence_url && (
                  <a href={u.evidence_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">View evidence</a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
