import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  organization: string | null;
  country: string | null;
  is_verified: boolean;
  created_at: string;
}

interface VerifyUserDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
}

const VerifyUserDialog = ({ user, open, onOpenChange, onVerified }: VerifyUserDialogProps) => {
  const { user: adminUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState("");

  const handleVerification = async (approve: boolean) => {
    if (!user || !adminUser) return;
    setSaving(true);
    try {
      // Update profile verification status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_verified: approve })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Log the verification event
      const { error: logError } = await supabase
        .from("verification_logs")
        .insert({
          user_id: adminUser.id,
          verification_type: approve ? "admin_approved" : "admin_rejected",
          comments: comments || (approve ? "Approved by admin" : "Rejected by admin"),
        });

      if (logError) console.error("Failed to log verification:", logError);

      toast.success(approve ? "User verified successfully" : "User verification rejected");
      setComments("");
      onVerified();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.message || "Verification failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Verify User
          </DialogTitle>
        </DialogHeader>
        {user && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="font-medium">{user.full_name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="font-medium">{user.email || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Organization</span>
                <span className="font-medium">{user.organization || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Country</span>
                <span className="font-medium">{user.country || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={user.is_verified ? "default" : "destructive"}>
                  {user.is_verified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Joined</span>
                <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Verification Comments</Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add notes about this verification decision..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="destructive"
                onClick={() => handleVerification(false)}
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => handleVerification(true)}
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VerifyUserDialog;
