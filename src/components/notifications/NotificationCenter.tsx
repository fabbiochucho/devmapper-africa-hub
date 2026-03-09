import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, MessageSquare, Megaphone, AlertCircle, Clock, Inbox, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "broadcast" | "message" | "alert";
  title: string;
  content: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationCenter = () => {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      // Batch both queries in parallel
      const [broadcastsResult, participationsResult] = await Promise.all([
        supabase
          .from("admin_broadcasts")
          .select("id, subject, message, priority, is_read_by, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", session.user.id),
      ]);

      let messageNotifications: Notification[] = [];
      
      if (participationsResult.data?.length) {
        const conversationIds = participationsResult.data.map(p => p.conversation_id);
        const { data: messages } = await supabase
          .from("direct_messages")
          .select("id, content, created_at")
          .in("conversation_id", conversationIds)
          .neq("sender_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        messageNotifications = (messages || []).map(msg => ({
          id: msg.id,
          type: "message" as const,
          title: "New Message",
          content: msg.content.substring(0, 100) + (msg.content.length > 100 ? "..." : ""),
          priority: "normal",
          isRead: false,
          createdAt: msg.created_at,
        }));
      }

      const broadcastNotifications: Notification[] = (broadcastsResult.data || []).map(b => ({
        id: b.id,
        type: "broadcast" as const,
        title: b.subject,
        content: b.message.substring(0, 100) + (b.message.length > 100 ? "..." : ""),
        priority: b.priority,
        isRead: Array.isArray(b.is_read_by) && b.is_read_by.includes(session.user.id),
        createdAt: b.created_at,
      }));

      const allNotifications = [...broadcastNotifications, ...messageNotifications]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(allNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Load on open
  useEffect(() => {
    if (session?.user && open) {
      loadNotifications();
    }
  }, [session?.user, open, loadNotifications]);

  // Realtime: listen for new broadcasts and messages
  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase
      .channel('notification-center')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_broadcasts',
      }, (payload) => {
        const b = payload.new as any;
        const notif: Notification = {
          id: b.id,
          type: "broadcast",
          title: b.subject,
          content: b.message?.substring(0, 100) || "",
          priority: b.priority || "normal",
          isRead: false,
          createdAt: b.created_at,
        };
        setNotifications(prev => [notif, ...prev]);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
      }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === session.user.id) return;
        const notif: Notification = {
          id: msg.id,
          type: "message",
          title: "New Message",
          content: msg.content?.substring(0, 100) || "",
          priority: "normal",
          isRead: false,
          createdAt: msg.created_at,
        };
        setNotifications(prev => [notif, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = useCallback(async () => {
    const broadcastIds = notifications
      .filter(n => n.type === "broadcast" && !n.isRead)
      .map(n => n.id);

    if (broadcastIds.length > 0 && session?.user?.id) {
      // Batch update all unread broadcasts in parallel
      await Promise.all(
        broadcastIds.map(id =>
          supabase
            .from("admin_broadcasts")
            .update({ is_read_by: [session.user.id] })
            .eq("id", id)
        )
      );
    }

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  }, [notifications, session?.user?.id]);

  const getIcon = (type: string, priority: string) => {
    if (type === "message") return <MessageSquare className="w-4 h-4 text-info" />;
    if (type === "broadcast") {
      if (priority === "urgent") return <AlertCircle className="w-4 h-4 text-destructive" />;
      if (priority === "high") return <AlertCircle className="w-4 h-4 text-warning" />;
      return <Megaphone className="w-4 h-4 text-primary" />;
    }
    return <Bell className="w-4 h-4" />;
  };

  const broadcastNotifs = notifications.filter(n => n.type === "broadcast");
  const messageNotifs = notifications.filter(n => n.type === "message");

  if (!session?.user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs gap-1">
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </Button>
            )}
          </div>
          <SheetDescription>
            Broadcasts, messages, and alerts
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="all" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              All
              {unreadCount > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="broadcasts">
              <Megaphone className="w-3 h-3 mr-1" />
              Broadcasts
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="w-3 h-3 mr-1" />
              Messages
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-200px)] mt-4">
            <TabsContent value="all" className="mt-0 space-y-2">
              {notifications.length === 0 ? (
                <EmptyState />
              ) : (
                notifications.map((notif) => (
                  <NotificationItem key={notif.id} notification={notif} getIcon={getIcon} />
                ))
              )}
            </TabsContent>

            <TabsContent value="broadcasts" className="mt-0 space-y-2">
              {broadcastNotifs.length === 0 ? (
                <EmptyState message="No broadcasts yet" />
              ) : (
                broadcastNotifs.map((notif) => (
                  <NotificationItem key={notif.id} notification={notif} getIcon={getIcon} />
                ))
              )}
            </TabsContent>

            <TabsContent value="messages" className="mt-0 space-y-2">
              {messageNotifs.length === 0 ? (
                <EmptyState message="No messages yet" />
              ) : (
                messageNotifs.map((notif) => (
                  <NotificationItem key={notif.id} notification={notif} getIcon={getIcon} />
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

const NotificationItem = ({ 
  notification, 
  getIcon 
}: { 
  notification: Notification; 
  getIcon: (type: string, priority: string) => React.ReactNode;
}) => (
  <div
    className={`p-3 rounded-lg border transition-colors ${
      notification.isRead ? "bg-background" : "bg-muted/50 border-primary/20"
    }`}
    role="article"
    aria-label={`${notification.isRead ? '' : 'Unread '}notification: ${notification.title}`}
  >
    <div className="flex items-start gap-3">
      <div className="mt-0.5">
        {getIcon(notification.type, notification.priority)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium truncate ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
            {notification.title}
          </p>
          {notification.priority === "urgent" && (
            <Badge variant="destructive" className="text-[10px] px-1">Urgent</Badge>
          )}
          {!notification.isRead && (
            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.content}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  </div>
);

const EmptyState = ({ message = "No notifications yet" }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
    <Inbox className="w-12 h-12 text-muted-foreground/50 mb-3" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

export default NotificationCenter;
