import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { africanCountries } from "@/data/countries";

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

interface EditUserDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const EditUserDialog = ({ user, open, onOpenChange, onSaved }: EditUserDialogProps) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    organization: user?.organization || "",
    country: user?.country || "",
  });

  // Sync form when user changes
  if (user && formData.full_name === "" && formData.email === "" && user.full_name) {
    setFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      organization: user.organization || "",
      country: user.country || "",
    });
  }

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name || null,
          organization: formData.organization || null,
          country: formData.country || null,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("User profile updated");
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) {
        setFormData({ full_name: "", email: "", organization: "", country: "" });
      }
      onOpenChange(v);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User: {user?.full_name || user?.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Email (read-only)</Label>
            <Input value={formData.email} disabled className="opacity-60" />
          </div>
          <div className="space-y-2">
            <Label>Organization</Label>
            <Input
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {africanCountries.map((c) => (
                  <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
