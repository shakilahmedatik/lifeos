import type { WorkoutSession, WorkoutSessionWithLogs, WorkoutStats } from "@lifeos/contracts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/queryKeys.js";
import * as api from "../api.js";

export function useWorkoutSessions() {
  const query = useQuery<WorkoutSession[]>({
    queryKey: queryKeys.workouts.sessions(),
    queryFn: () => api.fetchSessions(),
  });

  return {
    sessions: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: () => query.refetch(),
  };
}

export function useWorkoutSession(id: string) {
  const query = useQuery<WorkoutSessionWithLogs>({
    queryKey: queryKeys.workouts.session(id),
    queryFn: () => api.fetchSession(id),
    enabled: !!id,
  });

  return {
    session: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: () => query.refetch(),
  };
}

export function useWorkoutStats() {
  const query = useQuery<WorkoutStats>({
    queryKey: queryKeys.workouts.stats(),
    queryFn: () => api.fetchWorkoutStats(),
  });

  return {
    stats: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: () => query.refetch(),
  };
}
