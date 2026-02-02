"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationGroup {
  title: string;
  notifications: Notification[];
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (filter === "unread") {
        params.append("unreadOnly", "true");
      }
      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();
      setNotifications(data.notifications || []);
      setTotalPages(data.pagination?.totalPages || 1);
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
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      setNotifications((prev) =>
        prev.filter((n) => n.notificationId !== notificationId)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  // Group notifications by date
  const groupNotifications = (): NotificationGroup[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const groups: NotificationGroup[] = [
      { title: "Today", notifications: [] },
      { title: "Yesterday", notifications: [] },
      { title: "This Week", notifications: [] },
      { title: "Older", notifications: [] },
    ];

    notifications.forEach((notification) => {
      const date = new Date(notification.createdAt);
      if (date >= today) {
        groups[0].notifications.push(notification);
      } else if (date >= yesterday) {
        groups[1].notifications.push(notification);
      } else if (date >= thisWeek) {
        groups[2].notifications.push(notification);
      } else {
        groups[3].notifications.push(notification);
      }
    });

    return groups.filter((group) => group.notifications.length > 0);
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

  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

  const groupedNotifications = groupNotifications();
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <Link
              href="/notifications/preferences"
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </Link>
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilter("all");
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted"
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setFilter("unread");
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "unread"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted"
                }`}
              >
                Unread
              </button>
            </div>
            {hasUnread && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="bg-card rounded-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-card rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {filter === "unread"
                ? "No unread notifications"
                : "No notifications yet"}
            </h2>
            <p className="text-muted-foreground">
              {filter === "unread"
                ? "You're all caught up!"
                : "You'll see updates here when you receive endorsements"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedNotifications.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {group.title}
                </h2>
                <div className="bg-card rounded-lg divide-y divide-border">
                  {group.notifications.map((notification) => (
                    <div
                      key={notification.notificationId}
                      className={`p-4 hover:bg-muted transition-colors ${
                        !notification.isRead ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="text-3xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-foreground">
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <Badge variant="default" className="text-xs">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <p className="text-muted-foreground whitespace-pre-line mb-2">
                                {notification.message}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {getRelativeTime(notification.createdAt)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {notification.actionUrl && (
                                <Link
                                  href={notification.actionUrl}
                                  onClick={() => {
                                    if (!notification.isRead) {
                                      markAsRead(notification.notificationId);
                                    }
                                  }}
                                  className="text-primary hover:text-primary/80 text-sm font-medium whitespace-nowrap"
                                >
                                  View
                                </Link>
                              )}
                              <button
                                onClick={() =>
                                  deleteNotification(
                                    notification.notificationId
                                  )
                                }
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                title="Delete notification"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-card rounded-lg text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-card rounded-lg text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
