
import { useState, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  Notification,
} from "@/data/mockNotifications";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/sonner";

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    const userNotifications = await getNotifications(userId);
    setNotifications(userNotifications);
    setIsLoading(false);
  };

  const handleMarkAsRead = async (notificationId: number) => {
    await markNotificationAsRead(userId, notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read.");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onClosePopover={() => setIsOpen(false)}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">No new notifications.</div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onClosePopover: () => void;
}

function NotificationItem({ notification, onMarkAsRead, onClosePopover }: NotificationItemProps) {
  const content = (
    <div
      className={`p-4 hover:bg-muted/50 ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
      onClick={() => {
        if (!notification.read) {
          onMarkAsRead(notification.id);
        }
      }}
    >
      <div className="flex items-start space-x-4">
        {!notification.read && <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />}
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">{notification.title}</p>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );

  if (notification.actionUrl) {
    return <Link to={notification.actionUrl} onClick={onClosePopover}>{content}</Link>;
  }

  return <div className="cursor-pointer">{content}</div>;
}
