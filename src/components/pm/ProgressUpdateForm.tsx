import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { Send, ImagePlus } from "lucide-react";

interface ProgressUpdateFormProps {
  reportId: string;
  onCreated: () => void;
}

export default function ProgressUpdateForm({ reportId, onCreated }: ProgressUpdateFormProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [progress, setProgress] = useState([50]);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!text.trim() || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("project_updates").insert({
      report_id: reportId,
      update_text: text.trim(),
      progress_percent: progress[0],
      evidence_url: evidenceUrl || null,
      created_by: user.id,
    });
    if (error) {
      toast.error("Failed to submit update");
    } else {
      toast.success("Progress update submitted");
      setText("");
      setProgress([50]);
      setEvidenceUrl("");
      onCreated();
    }
    setSubmitting(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Submit Progress Update</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Update Description</Label>
          <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Describe project progress, issues, or achievements..." />
        </div>
        <div>
          <Label>Progress: {progress[0]}%</Label>
          <Slider value={progress} onValueChange={setProgress} min={0} max={100} step={5} className="mt-2" />
        </div>
        <div>
          <Label>Evidence URL (optional)</Label>
          <Input value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} placeholder="https://..." />
        </div>
        <Button onClick={submit} disabled={submitting || !text.trim()} className="w-full">
          <Send className="mr-2 h-4 w-4" />Submit Update
        </Button>
      </CardContent>
    </Card>
  );
}
