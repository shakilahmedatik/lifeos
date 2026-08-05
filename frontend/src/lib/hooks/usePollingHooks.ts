import type { Notification, Reminder } from "@lifeos/contracts";
import { useCallback, useState } from "react";
import { api } from "../api.js";
import { useVisibilityPolling } from "../useVisibilityPolling.js";

export function useNotifications(pollIntervalMs = 30000) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      const countData = await api.getUnreadCount();
      setUnreadCount(countData.count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useVisibilityPolling(fetchNotifications, pollIntervalMs);

  return { notifications, unreadCount, loading, error, refresh: fetchNotifications };
}

export function useReminders(pollIntervalMs = 30000) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    try {
      const data = await api.getReminders();
      setReminders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch reminders");
    } finally {
      setLoading(false);
    }
  }, []);

  useVisibilityPolling(fetchReminders, pollIntervalMs);

  return { reminders, loading, error, refresh: fetchReminders };
}
