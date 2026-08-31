import type { NotificationWithTask } from "@lifeos/contracts";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { ErrorBanner } from "../../components/ui/ErrorBanner.js";
import { RelativeTime } from "../../components/ui/RelativeTime.js";
import { getDataSource } from "../../lib/dataSource.js";

type Notification = NotificationWithTask;

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const ds = await getDataSource();
      const data = await ds.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const deleteNotification = async (id: string) => {
    try {
      setDeleting(id);
      const ds = await getDataSource();
      await ds.deleteNotification(id);
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
      setError("Failed to delete notification. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center text-secondary">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
        <span className="ml-3 text-sm">Loading notifications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorBanner message={error} onRetry={fetchNotifications} />
      </div>
    );
  }

  return (
    <div className="p-4 bg-surface-elevated border border-border rounded-xl">
      <h2 className="text-lg font-semibold text-primary mb-4">Scheduled Reminders</h2>
      {notifications.length === 0 ? (
        <EmptyState title="No notifications scheduled" className="py-4" />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-card-hover border border-border-subtle rounded-xl p-3 flex justify-between items-center text-primary"
            >
              <div>
                <p className="font-medium text-sm text-primary">{notification.taskTitle}</p>
                <p className="text-xs text-secondary mt-0.5">
                  Reminder in: <RelativeTime date={notification.reminderTime} />
                </p>
                <p className="text-xs text-muted">Sound: {notification.soundType}</p>
              </div>
              <button
                type="button"
                onClick={() => deleteNotification(notification.id)}
                disabled={deleting === notification.id}
                className="px-2.5 py-1 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting === notification.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
