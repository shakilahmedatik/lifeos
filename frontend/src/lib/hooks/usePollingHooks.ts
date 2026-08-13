import type { NotificationWithTask, Reminder } from "@lifeos/contracts";
import { useQuery } from "@tanstack/react-query";
import { getDataSource } from "../dataSource.js";
import { queryKeys } from "../queryKeys.js";

export function useNotifications(pollIntervalMs = 30000) {
  const ds = getDataSource();

  const notificationsQuery = useQuery<NotificationWithTask[]>({
    queryKey: queryKeys.notifications.all(),
    queryFn: () => ds.getNotifications(),
    refetchInterval: pollIntervalMs,
  });

  const unreadCountQuery = useQuery<{ count: number }>({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => ds.getUnreadCount(),
    refetchInterval: pollIntervalMs,
  });

  return {
    notifications: notificationsQuery.data ?? [],
    unreadCount: unreadCountQuery.data?.count ?? 0,
    loading: notificationsQuery.isLoading || unreadCountQuery.isLoading,
    error: notificationsQuery.error
      ? (notificationsQuery.error as Error).message
      : unreadCountQuery.error
        ? (unreadCountQuery.error as Error).message
        : null,
    refresh: async () => {
      await Promise.all([notificationsQuery.refetch(), unreadCountQuery.refetch()]);
    },
  };
}

export function useReminders(pollIntervalMs = 30000, date?: string) {
  const ds = getDataSource();

  const remindersQuery = useQuery<Reminder[]>({
    queryKey: queryKeys.reminders.all(date),
    queryFn: () => ds.getReminders(date),
    refetchInterval: pollIntervalMs,
  });

  return {
    reminders: remindersQuery.data ?? [],
    loading: remindersQuery.isLoading,
    error: remindersQuery.error ? (remindersQuery.error as Error).message : null,
    refresh: () => remindersQuery.refetch(),
  };
}
