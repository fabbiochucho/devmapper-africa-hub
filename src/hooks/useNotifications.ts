import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'action';
  read: boolean;
  created_at: string;
  action_url?: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications not supported in this browser');
      return false;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      toast.success('Notifications enabled!');
    }
    return result === 'granted';
  };

  const sendLocalNotification = useCallback((title: string, body: string, url?: string) => {
    if (permission !== 'granted') return;
    if (document.visibilityState === 'visible') return;
    
    const notification = new Notification(title, {
      body,
      icon: '/lovable-uploads/06a46dda-ed52-44ed-8f8e-2edb1752ffa6.png',
    });
    if (url) {
      notification.onclick = () => {
        window.focus();
        window.location.href = url;
      };
    }
  }, [permission]);

  // Load persisted notifications from DB + listen for realtime
  useEffect(() => {
    if (!user) return;

    // Fetch existing notifications from DB
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data.map(n => ({
          id: n.id,
          title: n.title,
          body: n.message || '',
          type: (n.type as AppNotification['type']) || 'info',
          read: n.is_read,
          created_at: n.created_at,
          action_url: n.link || undefined,
        })));
      }
    };

    fetchNotifications();

    // Listen for new notifications in realtime
    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const n = payload.new as any;
        const notif: AppNotification = {
          id: n.id,
          title: n.title,
          body: n.message || '',
          type: n.type || 'info',
          read: false,
          created_at: n.created_at,
          action_url: n.link || undefined,
        };
        setNotifications(prev => [notif, ...prev]);
        sendLocalNotification(notif.title, notif.body, notif.action_url);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sendLocalNotification]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (user) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    permission,
    requestPermission,
    markAsRead,
    markAllAsRead,
  };
}
