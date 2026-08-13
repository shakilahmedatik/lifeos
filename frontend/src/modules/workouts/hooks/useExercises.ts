import type { Exercise, NewExerciseInput } from "@lifeos/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/queryKeys.js";
import * as api from "../api.js";

export function useExercises() {
  const queryClient = useQueryClient();

  const exercisesQuery = useQuery<Exercise[]>({
    queryKey: queryKeys.workouts.exercises(),
    queryFn: () => api.fetchExercises(),
  });

  const invalidateExercises = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.workouts.exercises(),
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all() });
  };

  const createMutation = useMutation({
    mutationFn: (input: NewExerciseInput) => api.createExercise(input),
    onSuccess: () => invalidateExercises(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewExerciseInput> }) =>
      api.updateExercise(id, patch),
    onSuccess: () => invalidateExercises(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteExercise(id),
    onSuccess: () => invalidateExercises(),
  });

  return {
    exercises: exercisesQuery.data ?? [],
    loading: exercisesQuery.isLoading,
    error: exercisesQuery.error ? (exercisesQuery.error as Error).message : null,
    createExercise: (input: NewExerciseInput) => createMutation.mutateAsync(input),
    updateExercise: (id: string, patch: Partial<NewExerciseInput>) =>
      updateMutation.mutateAsync({ id, patch }),
    deleteExercise: (id: string) => deleteMutation.mutateAsync(id),
    refresh: () => exercisesQuery.refetch(),
  };
}

export function useExerciseProgress(exerciseId: string | null) {
  const query = useQuery<api.ExerciseProgressPoint[]>({
    queryKey: queryKeys.workouts.exerciseProgress(exerciseId || ""),
    queryFn: () => (exerciseId ? api.fetchExerciseProgress(exerciseId) : Promise.resolve([])),
    enabled: !!exerciseId,
  });

  return {
    progress: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: () => query.refetch(),
  };
}
