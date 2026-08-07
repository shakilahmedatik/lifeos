import type { NotificationWithTask } from "@lifeos/contracts";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api.js";

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
      const data = await api.getNotifications();
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
      await api.deleteNotification(id);
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
      <div className="p-6 flex items-center justify-center text-gray-400">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
        <span className="ml-3 text-sm">Loading notifications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-900/40 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchNotifications}
            className="ml-4 text-xs font-semibold underline text-red-300 hover:text-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800/40 border border-gray-700/40 rounded-xl">
      <h2 className="text-lg font-semibold text-gray-100 mb-4">Scheduled Reminders</h2>
      {notifications.length === 0 ? (
        <p className="text-gray-400 text-sm">No notifications scheduled</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-gray-700/30 border border-gray-600/30 rounded-xl p-3 flex justify-between items-center text-gray-200"
            >
              <div>
                <p className="font-medium text-sm text-gray-100">{notification.taskTitle}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Reminder: {new Date(notification.reminderTime).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Sound: {notification.soundType}</p>
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
