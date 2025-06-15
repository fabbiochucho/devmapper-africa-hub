
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, AlertCircle, Info, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/sonner";
import {
  Notification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotificationApi,
} from "@/data/mockNotifications";

interface UserType {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface NotificationSystemProps {
  user: UserType;
}

export default function NotificationSystem({ user }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    const userNotifications = await getNotifications(user.id.toString());
    setNotifications(userNotifications);
    setIsLoading(false);
  };

  const handleMarkAsRead = async (id: number) => {
    await markNotificationAsRead(user.id.toString(), id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(user.id.toString());
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read.");
  };

  const handleDeleteNotification = async (id: number) => {
    await deleteNotificationApi(user.id.toString(), id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.info("Notification dismissed.");
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning": return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "error": return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "info":
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "success": return "border-l-green-500 bg-green-50/50 dark:bg-green-900/10";
      case "warning": return "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10";
      case "error": return "border-l-red-500 bg-red-50/50 dark:bg-red-900/10";
      case "info":
      default: return "border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10";
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const content = (
      <div
        className={`relative p-3 border-l-4 cursor-pointer hover:bg-muted/50 transition-colors ${getNotificationColor(notification.type)}`}
        onClick={() => !notification.read && handleMarkAsRead(notification.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {getNotificationIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm ${!notification.read ? "font-semibold" : "font-medium"}`}>
                {notification.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteNotification(notification.id);
            }}
            className="ml-2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        {!notification.read && (
          <div className="w-2 h-2 bg-blue-600 rounded-full absolute right-3 top-4"></div>
        )}
      </div>
    );

    if (notification.actionUrl) {
      return <Link to={notification.actionUrl} onClick={() => setIsOpen(false)}>{content}</Link>;
    }
    return content;
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto z-50 shadow-lg border">
          <CardHeader className="p-3 pb-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Notifications</CardTitle>
              <div className="flex gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>Mark all read</Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : notifications.length > 0 ? (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">No new notifications</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
