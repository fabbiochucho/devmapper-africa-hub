import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Users, Plus, UserPlus, Building2, X } from "lucide-react";

const AFFILIATION_ROLES = [
  { value: "owner", label: "Owner" },
  { value: "sponsor", label: "Sponsor" },
  { value: "funder", label: "Funder" },
  { value: "partner", label: "Partner" },
  { value: "implementer", label: "Implementer" },
  { value: "monitor", label: "Monitor" },
];

interface Affiliation {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: { full_name: string | null; organization: string | null };
}

interface StakeholderAffiliationProps {
  reportId: string;
  isOwner: boolean;
}

export default function StakeholderAffiliation({ reportId, isOwner }: StakeholderAffiliationProps) {
  const { user } = useAuth();
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("partner");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAffiliations();
  }, [reportId]);

  const fetchAffiliations = async () => {
    const { data } = await supabase
      .from("project_affiliations")
      .select("id, user_id, relationship_type, created_at")
      .eq("report_id", reportId);

    if (data && data.length > 0) {
      const userIds = data.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, organization")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setAffiliations(data.map(a => ({
        id: a.id,
        user_id: a.user_id,
        role: a.relationship_type,
        created_at: a.created_at,
        profile: profileMap.get(a.user_id) || undefined,
      })));
    } else {
      setAffiliations([]);
    }
  };

  const handleAdd = async () => {
    if (!email.trim()) return;
    setSaving(true);
    try {
      // Look up user by email
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email.trim())
        .single();

      if (!profile) {
        toast.error("User not found with that email");
        setSaving(false);
        return;
      }

      // Check for existing affiliation
      const { data: existing } = await supabase
        .from("project_affiliations")
        .select("id")
        .eq("report_id", reportId)
        .eq("user_id", profile.user_id)
        .maybeSingle();

      if (existing) {
        toast.error("User is already affiliated with this project");
        setSaving(false);
        return;
      }

      const { error } = await supabase.from("project_affiliations").insert({
        report_id: reportId,
        user_id: profile.user_id,
        role,
      });

      if (error) throw error;
      toast.success("Stakeholder added!");
      setOpen(false);
      setEmail("");
      setRole("partner");
      fetchAffiliations();
    } catch {
      toast.error("Failed to add stakeholder");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("project_affiliations").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove");
    } else {
      toast.success("Stakeholder removed");
      fetchAffiliations();
    }
  };

  const getRoleBadgeVariant = (r: string): "default" | "secondary" | "outline" => {
    if (r === "owner") return "default";
    if (r === "funder" || r === "sponsor") return "secondary";
    return "outline";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Project Stakeholders
          </CardTitle>
          {isOwner && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Stakeholder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>User Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="user@organization.org"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AFFILIATION_ROLES.filter(r => r.value !== "owner").map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleAdd} disabled={saving || !email.trim()}>
                      {saving ? "Adding..." : "Add Stakeholder"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {affiliations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No stakeholders yet</p>
        ) : (
          <div className="space-y-2">
            {affiliations.map(a => (
              <div key={a.id} className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{a.profile?.full_name || "Unknown User"}</p>
                    {a.profile?.organization && (
                      <p className="text-xs text-muted-foreground">{a.profile.organization}</p>
                    )}
                  </div>
                  <Badge variant={getRoleBadgeVariant(a.role)}>{a.role}</Badge>
                </div>
                {isOwner && a.role !== "owner" && (
                  <Button size="sm" variant="ghost" onClick={() => handleRemove(a.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
