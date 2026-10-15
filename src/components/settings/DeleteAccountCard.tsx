import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/** Self-service account deletion: the delete-account function anonymises the account. */
const DeleteAccountCard = ({ onDeleted }: { onDeleted: () => void | Promise<void> }) => {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke("delete-account", { body: { confirm: confirmText } });
    setDeleting(false);
    if (error || !data?.success) {
      toast.error("Your account could not be deleted. Please try again or email dpo@becomechange.institute.");
      return;
    }
    toast.success("Your account has been deleted.");
    await onDeleted();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Deleting your account erases your personal details, saved items, notifications and the content of
        messages you sent, and permanently disables your login. Reports, verifications and payment records
        stay as anonymous records, as our <a href="/privacy" className="underline">Privacy Policy</a> explains.
      </p>
      <AlertDialog onOpenChange={(open) => !open && setConfirmText("")}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Delete Account</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. Type <b>DELETE</b> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            aria-label="Type DELETE to confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={confirmText !== "DELETE" || deleting}>
              {deleting ? "Deleting..." : "Delete my account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DeleteAccountCard;
