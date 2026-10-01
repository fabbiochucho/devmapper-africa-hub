import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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

// value fields are stored/matched (recipient_type, priority columns) - do not translate them.
// Display labels are resolved at render time via getRecipientLabel/getPriorityLabel below.
const RECIPIENT_TYPES = [
  { value: "all" },
  { value: "role:citizen_reporter" },
  { value: "role:ngo_member" },
  { value: "role:government_official" },
  { value: "role:company_representative" },
  { value: "role:change_maker" },
];

const PRIORITIES = [
  { value: "low", color: "bg-gray-100 text-gray-700" },
  { value: "normal", color: "bg-blue-100 text-blue-700" },
  { value: "high", color: "bg-orange-100 text-orange-700" },
  { value: "urgent", color: "bg-red-100 text-red-700" },
];

const BroadcastManager = () => {
  const { t } = useTranslation();
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
      toast.error(t('admin.broadcast.subjectMessageRequired'));
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

      toast.success(t('admin.broadcast.sendSuccess'));
      setSubject("");
      setMessage("");
      setRecipientType("all");
      setPriority("normal");
      loadBroadcasts();
    } catch (error) {
      console.error("Error sending broadcast:", error);
      toast.error(t('admin.broadcast.sendError'));
    } finally {
      setSending(false);
    }
  };

  const getRecipientLabel = (type: string) => {
    switch (type) {
      case "all": return t('admin.broadcast.recipientAll');
      case "role:citizen_reporter": return t('admin.broadcast.recipientCitizenReporters');
      case "role:ngo_member": return t('admin.broadcast.recipientNgoMembers');
      case "role:government_official": return t('admin.broadcast.recipientGovernmentOfficials');
      case "role:company_representative": return t('admin.broadcast.recipientCorporateRepresentatives');
      case "role:change_maker": return t('admin.broadcast.recipientChangeMakers');
      default: return type;
    }
  };

  const getPriorityLabel = (p: string) => {
    switch (p) {
      case "low": return t('admin.broadcast.priorityLow');
      case "high": return t('admin.broadcast.priorityHigh');
      case "urgent": return t('admin.broadcast.priorityUrgent');
      default: return t('admin.broadcast.priorityNormal');
    }
  };

  const getPriorityConfig = (p: string) => {
    const config = PRIORITIES.find(pr => pr.value === p) || PRIORITIES[1];
    return { ...config, label: getPriorityLabel(config.value) };
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Compose */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            {t('admin.broadcast.sendBroadcastTitle')}
          </CardTitle>
          <CardDescription>
            {t('admin.broadcast.sendBroadcastDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t('admin.broadcast.subjectLabel')}</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('admin.broadcast.subjectPlaceholder')}
            />
          </div>

          <div>
            <Label>{t('admin.broadcast.messageLabel')}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('admin.broadcast.messagePlaceholder')}
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('admin.broadcast.recipientsLabel')}</Label>
              <Select value={recipientType} onValueChange={setRecipientType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECIPIENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {getRecipientLabel(type.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('admin.broadcast.priorityLabel')}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {getPriorityLabel(p.value)}
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
            {t('admin.broadcast.sendBroadcastButton')}
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {t('admin.broadcast.recentBroadcastsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : broadcasts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('admin.broadcast.noBroadcastsYet')}</p>
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
