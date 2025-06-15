import { formatDistanceToNow } from "date-fns";

export interface Notification {
  id: number;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

const notifications: Record<string, Notification[]> = {
    "1": [
        {
            id: Date.now() + 1,
            type: "success",
            title: "Welcome to DevMapper!",
            message: "Thanks for joining. Start by reporting your first project.",
            timestamp: new Date().toISOString(),
            read: false,
            actionUrl: "/submit-report",
        }
    ],
    "3": [
        {
            id: Date.now() + 2,
            type: "info",
            title: "New Project Pending Review",
            message: "A new project 'Community Library Build' has been submitted in your region and needs your approval.",
            timestamp: new Date().toISOString(),
            read: true,
            actionUrl: "/reports",
        },
        {
            id: Date.now() + 3,
            type: "warning",
            title: "Budget Alert",
            message: "The 'Rural Electrification' project is approaching its budget limit.",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            read: false,
            actionUrl: "/reports/REP-001",
        }
    ]
};

export const getNotifications = (userId: string): Promise<Notification[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(notifications[userId] || []);
    }, 500);
  });
};

export const createNotification = (data: {
  userId: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
}): Promise<Notification> => {
  return new Promise((resolve) => {
    if (!notifications[data.userId]) {
      notifications[data.userId] = [];
    }

    const newNotification: Notification = {
      id: Date.now(),
      type: data.type,
      title: data.title,
      message: data.message,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: data.actionUrl,
    };

    notifications[data.userId].unshift(newNotification);

    if (notifications[data.userId].length > 50) {
      notifications[data.userId] = notifications[data.userId].slice(0, 50);
    }
    
    setTimeout(() => {
        resolve(newNotification);
    }, 200);
  });
};

export const markNotificationAsRead = (
  userId: string,
  notificationId: number
): Promise<Notification | null> => {
  return new Promise((resolve) => {
    const userNotifications = notifications[userId];
    if (!userNotifications) {
      resolve(null);
      return;
    }

    const notification = userNotifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
    
    setTimeout(() => {
        resolve(notification || null);
    }, 200);
  });
};

export const markAllNotificationsAsRead = (
  userId: string
): Promise<Notification[]> => {
  return new Promise((resolve) => {
    const userNotifications = notifications[userId];
    if (userNotifications) {
      userNotifications.forEach((n) => (n.read = true));
    }
    setTimeout(() => {
      resolve(userNotifications || []);
    }, 200);
  });
};

export const deleteNotification = (
  userId: string,
  notificationId: number
): Promise<boolean> => {
  return new Promise((resolve) => {
    const userNotifications = notifications[userId];
    if (!userNotifications) {
      resolve(false);
      return;
    }

    const initialLength = userNotifications.length;
    notifications[userId] = userNotifications.filter(
      (n) => n.id !== notificationId
    );
    const success = notifications[userId].length < initialLength;

    setTimeout(() => {
      resolve(success);
    }, 200);
  });
};
