import { useState, useEffect } from 'react';
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

  const sendLocalNotification = (title: string, body: string, url?: string) => {
    if (permission !== 'granted') return;
    if (document.visibilityState === 'visible') return; // Don't send if app is focused
    
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
  };

  // Listen to realtime changes for notifications
  useEffect(() => {
    if (!user) return;

    // Listen for new reports on projects the user is affiliated with
    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_milestones',
      }, (payload) => {
        const milestone = payload.new as any;
        const notif: AppNotification = {
          id: milestone.id,
          title: 'New Milestone Added',
          body: `A new milestone "${milestone.title}" was added to a project.`,
          type: 'info',
          read: false,
          created_at: milestone.created_at,
          action_url: '/my-projects',
        };
        setNotifications(prev => [notif, ...prev]);
        sendLocalNotification(notif.title, notif.body, notif.action_url);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'reports',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const report = payload.new as any;
        if (report.is_verified && !(payload.old as any)?.is_verified) {
          const notif: AppNotification = {
            id: `verified-${report.id}`,
            title: 'Report Verified!',
            body: `Your report "${report.title}" has been verified.`,
            type: 'success',
            read: false,
            created_at: new Date().toISOString(),
            action_url: '/my-projects',
          };
          setNotifications(prev => [notif, ...prev]);
          sendLocalNotification(notif.title, notif.body, notif.action_url);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

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
