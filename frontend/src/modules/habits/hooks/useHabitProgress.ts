import { getClientDateString, type HabitWithStreak } from "@lifeos/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDataSource } from "../../../lib/dataSource.js";
import { queryKeys } from "../../../lib/queryKeys.js";

export function useHabitProgress() {
  const queryClient = useQueryClient();
  const ds = getDataSource();

  const progressQuery = useQuery<HabitWithStreak[]>({
    queryKey: queryKeys.habits.today(),
    queryFn: () => ds.getTodayHabits(),
  });

  const invalidateProgress = () => {
    queryClient.invalidateQueries({ queryKey: ["habits"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const addLogMutation = useMutation({
    mutationFn: ({ habitId, value, meta }: { habitId: string; value: number; meta?: string }) => {
      const date = getClientDateString();
      return ds.logHabit(habitId, date, value, meta);
    },
    onSuccess: () => invalidateProgress(),
  });

  const removeLogMutation = useMutation({
    mutationFn: (logId: string) => ds.unlogHabitByLogId(logId),
    onSuccess: () => invalidateProgress(),
  });

  const progresses = progressQuery.data ?? [];

  return {
    progresses,
    loading: progressQuery.isLoading,
    error: progressQuery.error ? (progressQuery.error as Error).message : null,
    addLog: (habitId: string, value = 1, meta?: string) =>
      addLogMutation.mutateAsync({ habitId, value, meta }),
    removeLog: (logId: string) => removeLogMutation.mutateAsync(logId),
    refresh: () => progressQuery.refetch(),
  };
}
