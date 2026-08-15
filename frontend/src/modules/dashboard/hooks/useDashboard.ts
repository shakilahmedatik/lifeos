import type { DashboardSummary, NewReminderInput } from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts/date-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppToast } from "../../../components/Toast.js";
import { getDataSource } from "../../../lib/dataSource.js";
import { queryKeys } from "../../../lib/queryKeys.js";

export function useDashboard() {
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const today = getClientDateString();
  const ds = getDataSource();

  const summaryQuery = useQuery<DashboardSummary>({
    queryKey: queryKeys.dashboard.summary(today),
    queryFn: () => ds.getSummary(today),
    refetchInterval: 15_000,
  });

  const invalidateSummary = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.summary(today),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.routine.tasks(today),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.habits.today(),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.reminders.all(),
    });
  };

  const startTaskMutation = useMutation({
    mutationFn: (taskId: string) => ds.updateTaskStatus(taskId, "in_progress"),
    onSuccess: () => {
      toast.success("Task started");
      invalidateSummary();
    },
    onError: () => toast.error("Failed to start task"),
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => ds.updateTaskStatus(taskId, "done"),
    onSuccess: () => {
      toast.success("Task completed!");
      invalidateSummary();
    },
    onError: () => toast.error("Failed to complete task"),
  });

  const logHabitMutation = useMutation({
    mutationFn: ({ habitId, value, meta }: { habitId: string; value: number; meta?: string }) =>
      ds.logHabit(habitId, today, value, meta),
    onSuccess: () => invalidateSummary(),
    onError: () => toast.error("Failed to log habit"),
  });

  const unlogHabitMutation = useMutation({
    mutationFn: (logId: string) => ds.unlogHabitByLogId(logId),
    onSuccess: () => invalidateSummary(),
    onError: () => toast.error("Failed to undo habit log"),
  });

  const completeReminderMutation = useMutation({
    mutationFn: (id: string) => ds.updateReminder(id, { completed: true }),
    onSuccess: () => invalidateSummary(),
    onError: () => toast.error("Failed to update reminder"),
  });

  const createReminderMutation = useMutation({
    mutationFn: (input: NewReminderInput) => ds.createReminder(input),
    onSuccess: () => {
      toast.success("Reminder added");
      invalidateSummary();
    },
    onError: () => toast.error("Failed to create reminder"),
  });

  return {
    summary: summaryQuery.data ?? null,
    loading: summaryQuery.isLoading,
    error: summaryQuery.error ? (summaryQuery.error as Error).message : null,
    refresh: () => summaryQuery.refetch(),
    startTask: (taskId: string) => startTaskMutation.mutateAsync(taskId),
    completeTask: (taskId: string) => completeTaskMutation.mutateAsync(taskId),
    logHabit: (habitId: string, value: number, meta?: string) =>
      logHabitMutation.mutateAsync({ habitId, value, meta }),
    unlogHabit: (logId: string) => unlogHabitMutation.mutateAsync(logId),
    completeReminder: (id: string) => completeReminderMutation.mutateAsync(id),
    createReminder: (input: NewReminderInput) => createReminderMutation.mutateAsync(input),
  };
}
