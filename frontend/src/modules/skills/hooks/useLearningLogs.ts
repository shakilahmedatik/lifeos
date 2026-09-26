import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDataSource } from "../../../lib/dataSource.js";
import { queryKeys } from "../../../lib/queryKeys.js";
import type { LearningLog, NewLearningLogInput, UpdateLearningLogInput } from "../types.js";

export function useLearningLogs(resourceId?: string) {
  const queryClient = useQueryClient();
  const ds = getDataSource();

  const today = new Date().toISOString().split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const logsQuery = useQuery<LearningLog[]>({
    queryKey: resourceId
      ? queryKeys.skills.logsByResource(resourceId)
      : queryKeys.skills.logsByRange(monthAgo, today),
    queryFn: () =>
      resourceId
        ? ds.getLearningLogsByResource(resourceId)
        : ds.getLearningLogsByRange(monthAgo, today),
  });

  const invalidateLogs = () => {
    queryClient.invalidateQueries({
      queryKey: ["skills", "logs"],
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
  };

  const addLogMutation = useMutation({
    mutationFn: (input: NewLearningLogInput) => ds.logLearningSession(input),
    onSuccess: () => invalidateLogs(),
  });

  const editLogMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateLearningLogInput }) =>
      ds.updateLearningLog(id, patch),
    onSuccess: () => invalidateLogs(),
  });

  const removeLogMutation = useMutation({
    mutationFn: (id: string) => ds.deleteLearningLog(id),
    onSuccess: () => invalidateLogs(),
  });

  return {
    logs: logsQuery.data ?? [],
    loading: logsQuery.isLoading,
    error: logsQuery.error ? (logsQuery.error as Error).message : null,
    addLog: (input: NewLearningLogInput) => addLogMutation.mutateAsync(input),
    editLog: (id: string, patch: UpdateLearningLogInput) =>
      editLogMutation.mutateAsync({ id, patch }),
    removeLog: (id: string) => removeLogMutation.mutateAsync(id),
    refresh: () => logsQuery.refetch(),
  };
}
