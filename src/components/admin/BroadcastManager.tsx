import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Megaphone, Users, Clock, CheckCircle, Loader2 } from "lucide-react";

interface Broadcast {
  id: string;
  subject: string;
  message: string;
  recipient_type: string;
  priority: string;
  created_at: string;
  is_read_by: any;
}

const RECIPIENT_TYPES = [
  { value: "all", label: "All Users" },
  { value: "role:citizen_reporter", label: "Citizen Reporters" },
  { value: "role:ngo_member", label: "NGO Members" },
  { value: "role:government_official", label: "Government Officials" },
  { value: "role:company_representative", label: "Corporate Representatives" },
  { value: "role:change_maker", label: "Change Makers" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-700" },
  { value: "normal", label: "Normal", color: "bg-blue-100 text-blue-700" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-700" },
];

const BroadcastManager = () => {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState("all");
  const [priority, setPriority] = useState("normal");

  useEffect(() => {
    loadBroadcasts();
  }, []);

  const loadBroadcasts = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_broadcasts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setBroadcasts(data || []);
    } catch (error) {
      console.error("Error loading broadcasts:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendBroadcast = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required");
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("admin_broadcasts")
        .insert({
          sender_id: user.id,
          subject,
          message,
          recipient_type: recipientType,
          priority,
        });

      if (error) throw error;

      toast.success("Broadcast sent successfully");
      setSubject("");
      setMessage("");
      setRecipientType("all");
      setPriority("normal");
      loadBroadcasts();
    } catch (error) {
      console.error("Error sending broadcast:", error);
      toast.error("Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  const getRecipientLabel = (type: string) => {
    return RECIPIENT_TYPES.find(r => r.value === type)?.label || type;
  };

  const getPriorityConfig = (p: string) => {
    return PRIORITIES.find(pr => pr.value === p) || PRIORITIES[1];
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Compose */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Send Broadcast
          </CardTitle>
          <CardDescription>
            Send messages to all users or specific user groups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Broadcast subject"
            />
          </div>

          <div>
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Recipients</Label>
              <Select value={recipientType} onValueChange={setRecipientType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECIPIENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={sendBroadcast} disabled={sending} className="w-full">
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send Broadcast
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Broadcasts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : broadcasts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No broadcasts sent yet</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {broadcasts.map((broadcast) => {
                const priorityConfig = getPriorityConfig(broadcast.priority);
                return (
                  <div key={broadcast.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm">{broadcast.subject}</h4>
                      <Badge className={`text-xs ${priorityConfig.color}`}>
                        {priorityConfig.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {broadcast.message}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {getRecipientLabel(broadcast.recipient_type)}
                      </div>
                      <span>{new Date(broadcast.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BroadcastManager;
