import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Calendar, Target, Users, DollarSign, CheckCircle2, Plus, Eye, EyeOff, Flame, Thermometer, Recycle, Coins, Scale, TrendingUp } from "lucide-react";
import AddMilestoneDialog from "./AddMilestoneDialog";
import SubmitVerificationDialog from "./SubmitVerificationDialog";
import CitizenFeedbackPanel from "./CitizenFeedbackPanel";
import ProjectLifecycleManager from "./ProjectLifecycleManager";
import StakeholderAffiliation from "./StakeholderAffiliation";
import KanbanBoard from "./KanbanBoard";
import DonorReportExport from "@/components/report/DonorReportExport";
import ImpactScorecard from "@/components/scoring/ImpactScorecard";
import ProcurementTracker from "./ProcurementTracker";
import CarbonTab from "@/components/carbon/CarbonTab";
import ClimateTab from "@/components/carbon/ClimateTab";
import CircularityTab from "@/components/carbon/CircularityTab";
import CarbonAssetsTab from "@/components/carbon/CarbonAssetsTab";
import ComplianceTab from "@/components/carbon/ComplianceTab";
import FinancialImpactTab from "@/components/carbon/FinancialImpactTab";
import { toast } from "sonner";

interface ProjectWorkspaceProps {
  reportId: string;
  report: any;
}

const LIFECYCLE_STEPS = [
  { key: "idea", label: "Idea / Proposal" },
  { key: "planning", label: "Planning" },
  { key: "funded", label: "Funding Secured" },
  { key: "implementation", label: "Implementation" },
  { key: "monitoring", label: "Monitoring" },
  { key: "completed", label: "Completion" },
  { key: "verified", label: "Verified" },
];

const STATUS_ORDER: Record<string, number> = {
  idea: 0, planning: 1, funded: 2, implementation: 3, monitoring: 4, delayed: 3, "on-hold": 3, cancelled: -1, completed: 5, verified: 6,
};

export default function ProjectWorkspace({ reportId, report }: ProjectWorkspaceProps) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState(report?.project_status || "idea");
  const [visibility, setVisibility] = useState(report?.visibility || "public");
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");

  const isOwner = user?.id === report?.user_id;

  useEffect(() => {
    if (!reportId) return;
    Promise.all([
      supabase.from("project_milestones").select("*").eq("report_id", reportId).order("target_date"),
      supabase.from("project_verifications").select("*").eq("report_id", reportId).order("created_at"),
      supabase.from("project_budgets").select("*").eq("report_id", reportId),
      supabase.from("project_updates").select("*").eq("report_id", reportId).order("created_at", { ascending: false }).limit(5),
      supabase.from("project_indicators").select("*").eq("report_id", reportId),
      supabase.from("project_tasks").select("*").eq("report_id", reportId).order("created_at"),
    ]).then(([m, v, b, u, ind, t]) => {
      if (m.data) setMilestones(m.data);
      if (v.data) setVerifications(v.data);
      if (b.data) setBudgets(b.data);
      if (u.data) setUpdates(u.data);
      if (ind.data) setIndicators(ind.data);
      if (t.data) setTasks(t.data);
    });
  }, [reportId]);

  const addTask = async () => {
    if (!newTaskTitle.trim() || !user) return;
    const { error } = await supabase.from("project_tasks").insert({
      report_id: reportId,
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      created_by: user.id,
    } as any);
    if (error) { toast.error("Failed to add task"); return; }
    toast.success("Task added");
    setNewTaskTitle("");
    setAddTaskOpen(false);
    const { data } = await supabase.from("project_tasks").select("*").eq("report_id", reportId).order("created_at");
    if (data) setTasks(data);
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    await supabase.from("project_tasks").update({ status: newStatus } as any).eq("id", taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const toggleVisibility = async () => {
    const newVis = visibility === "public" ? "private" : "public";
    await supabase.from("reports").update({ visibility: newVis } as any).eq("id", reportId);
    setVisibility(newVis);
    toast.success(`Project is now ${newVis}`);
  };

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
              <Badge className="text-sm">{currentStatus}</Badge>
              {isOwner && (
                <Button variant="ghost" size="sm" onClick={toggleVisibility} className="gap-1 text-xs">
                  {visibility === "public" ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {visibility === "public" ? "Public" : "Private"}
                </Button>
              )}
              {report.beneficiaries && (
                <span className="text-sm text-muted-foreground"><Users className="inline h-3 w-3 mr-1" />{report.beneficiaries.toLocaleString()} beneficiaries</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Workspace — PRD V8 Carbon Evolution */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="carbon" className="gap-1"><Flame className="h-3 w-3" />Carbon</TabsTrigger>
          <TabsTrigger value="climate" className="gap-1"><Thermometer className="h-3 w-3" />Climate</TabsTrigger>
          <TabsTrigger value="circularity" className="gap-1"><Recycle className="h-3 w-3" />Circularity</TabsTrigger>
          <TabsTrigger value="assets" className="gap-1"><Coins className="h-3 w-3" />Carbon Assets</TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1"><Scale className="h-3 w-3" />Compliance</TabsTrigger>
          <TabsTrigger value="financial" className="gap-1"><TrendingUp className="h-3 w-3" />Financial Impact</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB — existing content */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Project Lifecycle Manager */}
          <Card>
            <CardHeader><CardTitle className="text-base">Project Lifecycle</CardTitle></CardHeader>
            <CardContent>
              <ProjectLifecycleManager
                reportId={reportId}
                currentStatus={currentStatus}
                isOwner={isOwner}
                onStatusChange={setCurrentStatus}
              />
            </CardContent>
          </Card>

          {/* Task Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Tasks ({tasks.length})</CardTitle>
                {isOwner && (
                  <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Add Task</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div><Label>Title</Label><Input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Task title..." /></div>
                        <div>
                          <Label>Priority</Label>
                          <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={addTask} disabled={!newTaskTitle.trim()}>Add Task</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet. Add tasks to track project work.</p>
              ) : (
                <KanbanBoard
                  tasks={tasks.map(t => ({ id: t.id, title: t.title, description: t.description, priority: t.priority, status: t.status, due_date: t.due_date, assigned_to: t.assigned_to, tags: t.tags || [] }))}
                  onStatusChange={handleTaskStatusChange}
                  hasAssignment={false}
                />
              )}
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
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Verification Status</CardTitle>
                  <SubmitVerificationDialog reportId={reportId} onSubmitted={() => {
                    supabase.from("project_verifications").select("*").eq("report_id", reportId).order("created_at").then(r => { if (r.data) setVerifications(r.data); });
                  }} />
                </div>
              </CardHeader>
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Milestones</CardTitle>
                <AddMilestoneDialog reportId={reportId} onAdded={() => {
                  supabase.from("project_milestones").select("*").eq("report_id", reportId).order("target_date").then(r => { if (r.data) setMilestones(r.data); });
                }} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">No milestones yet. Add one to track project phases.</p>
              ) : (
                milestones.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <CheckCircle2 className={`h-5 w-5 shrink-0 ${m.status === "completed" ? "text-green-500" : "text-muted-foreground"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.title}</p>
                      {m.target_date && <p className="text-xs text-muted-foreground">Target: {m.target_date}</p>}
                    </div>
                    <Progress value={m.completion_percentage} className="w-20 h-2" />
                    <span className="text-xs text-muted-foreground w-8">{m.completion_percentage}%</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

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

          {/* DISM Impact Scorecard */}
          <ImpactScorecard reportId={reportId} readOnly={!isOwner} />

          {/* Procurement & Contract Tracking */}
          <ProcurementTracker reportId={reportId} isOwner={isOwner} />

          {/* Stakeholder Affiliation */}
          <StakeholderAffiliation reportId={reportId} isOwner={isOwner} />

          {/* Donor Report Export */}
          <DonorReportExport report={report} milestones={milestones} budgets={budgets} indicators={indicators} />

          {/* Community Feedback */}
          <CitizenFeedbackPanel reportId={reportId} />
        </TabsContent>

        {/* CARBON TAB — Phase 1 */}
        <TabsContent value="carbon" className="mt-4">
          <CarbonTab reportId={reportId} isOwner={isOwner} />
        </TabsContent>

        {/* CLIMATE TAB — Phase 2 */}
        <TabsContent value="climate" className="mt-4">
          <ClimateTab reportId={reportId} isOwner={isOwner} />
        </TabsContent>

        {/* CIRCULARITY TAB — Phase 2 */}
        <TabsContent value="circularity" className="mt-4">
          <CircularityTab reportId={reportId} isOwner={isOwner} />
        </TabsContent>

        {/* CARBON ASSETS TAB — Phase 3 */}
        <TabsContent value="assets" className="mt-4">
          <CarbonAssetsTab reportId={reportId} isOwner={isOwner} />
        </TabsContent>

        {/* COMPLIANCE TAB — Phase 4 */}
        <TabsContent value="compliance" className="mt-4">
          <ComplianceTab reportId={reportId} isOwner={isOwner} />
        </TabsContent>

        {/* FINANCIAL IMPACT TAB — Phase 5 */}
        <TabsContent value="financial" className="mt-4">
          <FinancialImpactTab reportId={reportId} isOwner={isOwner} projectCost={report?.cost} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
