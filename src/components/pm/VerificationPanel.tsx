import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/UserRoleContext";
import { toast } from "@/components/ui/sonner";
import { Shield, CheckCircle2, XCircle, Clock } from "lucide-react";

interface VerificationPanelProps {
  reportId: string;
  isOwner: boolean;
}

const LEVELS = [
  { key: "self_report", label: "Self Report", description: "Project owner submits progress", allowedRoles: ["all"] },
  { key: "citizen", label: "Community Verification", description: "Citizens confirm progress", allowedRoles: ["citizen_reporter", "change_maker"] },
  { key: "ngo", label: "NGO Verification", description: "NGOs validate progress data", allowedRoles: ["ngo_member"] },
  { key: "government", label: "Institutional Verification", description: "Government or auditors verify", allowedRoles: ["government_official"] },
  { key: "platform_audit", label: "Platform Audit", description: "DevMapper admin approval", allowedRoles: ["admin", "platform_admin"] },
];

export default function VerificationPanel({ reportId, isOwner }: VerificationPanelProps) {
  const { user } = useAuth();
  const { currentRole, hasRole } = useUserRole();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [comments, setComments] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, [reportId]);

  const fetchVerifications = async () => {
    const { data } = await supabase
      .from("project_verifications")
      .select("*")
      .eq("report_id", reportId)
      .order("created_at");
    if (data) setVerifications(data);
  };

  const canVerifyLevel = (level: typeof LEVELS[0]) => {
    if (level.key === "self_report") return isOwner;
    if (level.allowedRoles.includes("all")) return true;
    return level.allowedRoles.some(r => hasRole(r as any));
  };

  const availableLevels = LEVELS.filter(l => canVerifyLevel(l));

  const submit = async (status: "approved" | "rejected") => {
    if (!selectedLevel || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("project_verifications").insert({
      report_id: reportId,
      verifier_id: user.id,
      verification_level: selectedLevel,
      status,
      comments: comments || null,
      verified_at: new Date().toISOString(),
    });
    if (error) {
      toast.error("Failed to submit verification");
    } else {
      toast.success(`Verification ${status}`);
      setComments("");
      setSelectedLevel("");
      fetchVerifications();
    }
    setSubmitting(false);
  };

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === "rejected") return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      {/* Current verification status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />Verification Levels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {LEVELS.map(level => {
            const v = verifications.find((vr: any) => vr.verification_level === level.key);
            return (
              <div key={level.key} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium">{level.label}</p>
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {v ? (
                    <>
                      {statusIcon(v.status)}
                      <Badge variant={v.status === "approved" ? "default" : "destructive"}>
                        {v.status === "approved" ? "Verified" : "Rejected"}
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Submit verification */}
      {availableLevels.length > 0 && user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submit Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Verification Level</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  {availableLevels.map(l => (
                    <SelectItem key={l.key} value={l.key}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Comments</Label>
              <Textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Add verification notes..." />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => submit("approved")} disabled={submitting || !selectedLevel} className="flex-1">
                <CheckCircle2 className="mr-2 h-4 w-4" />Approve
              </Button>
              <Button onClick={() => submit("rejected")} disabled={submitting || !selectedLevel} variant="destructive" className="flex-1">
                <XCircle className="mr-2 h-4 w-4" />Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification history */}
      {verifications.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Verification History</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {verifications.map((v: any) => (
              <div key={v.id} className="flex items-start gap-3 border rounded p-3">
                {statusIcon(v.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{v.verification_level.replace("_", " ")}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</span>
                  </div>
                  {v.comments && <p className="text-sm mt-1">{v.comments}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
