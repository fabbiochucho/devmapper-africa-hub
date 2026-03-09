import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bell, Mail, MessageSquare, Megaphone, Save } from 'lucide-react';

interface NotificationPrefs {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  marketing_emails: boolean;
}

export default function NotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    marketing_emails: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchPrefs = async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPrefs({
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          sms_notifications: data.sms_notifications ?? false,
          marketing_emails: data.marketing_emails ?? false,
        });
      } else if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is fine for new users
        console.error('Error fetching prefs:', error);
      }
      setLoading(false);
    };

    fetchPrefs();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...prefs,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Notification preferences saved');
    } catch (error: any) {
      toast.error('Failed to save preferences: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to receive updates about your projects and platform activity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email" className="font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive project updates, verification status, and important alerts via email
                </p>
              </div>
            </div>
            <Switch
              id="email"
              checked={prefs.email_notifications}
              onCheckedChange={(checked) => setPrefs({ ...prefs, email_notifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="push" className="font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Get real-time browser notifications for urgent updates
                </p>
              </div>
            </div>
            <Switch
              id="push"
              checked={prefs.push_notifications}
              onCheckedChange={(checked) => setPrefs({ ...prefs, push_notifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="sms" className="font-medium">SMS Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive critical alerts via SMS (requires phone number)
                </p>
              </div>
            </div>
            <Switch
              id="sms"
              checked={prefs.sms_notifications}
              onCheckedChange={(checked) => setPrefs({ ...prefs, sms_notifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Megaphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="marketing" className="font-medium">Marketing & Updates</Label>
                <p className="text-xs text-muted-foreground">
                  News about new features, platform updates, and SDG insights
                </p>
              </div>
            </div>
            <Switch
              id="marketing"
              checked={prefs.marketing_emails}
              onCheckedChange={(checked) => setPrefs({ ...prefs, marketing_emails: checked })}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  );
}
