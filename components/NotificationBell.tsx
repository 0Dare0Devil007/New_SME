"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RiNotification3Line } from "@remixicon/react";

interface Notification {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications/unread-count");
      const data = await response.json();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // Fetch recent notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=10");
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        )
      );
      fetchUnreadCount();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ENDORSEMENT":
        return "👍";
      case "NOMINATION":
        return "⭐";
      case "NOMINATION_DECISION":
        return "✅";
      case "PROFILE_ACTIVATED":
        return "🎉";
      case "PROFILE_DEACTIVATED":
        return "⏸️";
      case "NEW_SME_IN_DEPT":
        return "👋";
      default:
        return "🔔";
    }
  };

  // Poll for unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when popover opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
          <RiNotification3Line className="w-6 h-6 text-foreground" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-lg text-foreground">Notifications</h3>
          <Link
            href="/notifications"
            className="text-sm text-primary hover:text-primary/80"
            onClick={() => setIsOpen(false)}
          >
            View all
          </Link>
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="text-4xl mb-2">🔔</div>
              <p className="font-medium">No notifications yet</p>
              <p className="text-sm mt-1">
                You&apos;ll see updates here when you receive endorsements
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.notificationId}
                  className={`p-4 border-b border-border hover:bg-muted transition-colors cursor-pointer ${
                    !notification.isRead ? "bg-primary/10" : ""
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.notificationId);
                    }
                    if (notification.actionUrl) {
                      setIsOpen(false);
                      window.location.href = notification.actionUrl;
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
