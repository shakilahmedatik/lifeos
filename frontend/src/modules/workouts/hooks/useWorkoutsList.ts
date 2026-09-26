import type { NewWorkoutInput, Workout, WorkoutWithExercises } from "@lifeos/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/queryKeys.js";
import * as api from "../api.js";

export function useWorkouts() {
  const queryClient = useQueryClient();

  const workoutsQuery = useQuery<Workout[]>({
    queryKey: queryKeys.workouts.all(),
    queryFn: () => api.fetchWorkouts(),
  });

  const invalidateWorkouts = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
  };

  const createMutation = useMutation({
    mutationFn: (input: NewWorkoutInput) => api.createWorkout(input),
    onSuccess: () => invalidateWorkouts(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewWorkoutInput> }) =>
      api.updateWorkout(id, patch),
    onSuccess: () => invalidateWorkouts(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteWorkout(id),
    onSuccess: () => invalidateWorkouts(),
  });

  return {
    workouts: workoutsQuery.data ?? [],
    loading: workoutsQuery.isLoading,
    error: workoutsQuery.error ? (workoutsQuery.error as Error).message : null,
    createWorkout: (input: NewWorkoutInput) => createMutation.mutateAsync(input),
    updateWorkout: (id: string, patch: Partial<NewWorkoutInput>) =>
      updateMutation.mutateAsync({ id, patch }),
    deleteWorkout: (id: string) => deleteMutation.mutateAsync(id),
    refresh: () => workoutsQuery.refetch(),
  };
}

export function useWorkout(id: string) {
  const queryClient = useQueryClient();

  const workoutQuery = useQuery<WorkoutWithExercises>({
    queryKey: ["workouts", "detail", id],
    queryFn: () => api.fetchWorkout(id),
    enabled: !!id,
  });

  const invalidateDetail = () => {
    queryClient.invalidateQueries({ queryKey: ["workouts", "detail", id] });
    queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all() });
  };

  const reorderMutation = useMutation({
    mutationFn: (exerciseIds: string[]) => api.reorderWorkoutExercises(id, exerciseIds),
    onSuccess: () => invalidateDetail(),
  });

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<NewWorkoutInput>) => api.updateWorkout(id, patch),
    onSuccess: () => invalidateDetail(),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteWorkout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all() });
    },
  });

  return {
    workout: workoutQuery.data ?? null,
    loading: workoutQuery.isLoading,
    error: workoutQuery.error ? (workoutQuery.error as Error).message : null,
    refresh: () => workoutQuery.refetch(),
    reorderExercises: (exerciseIds: string[]) => reorderMutation.mutateAsync(exerciseIds),
    updateWorkout: (patch: Partial<NewWorkoutInput>) => updateMutation.mutateAsync(patch),
    deleteWorkout: () => deleteMutation.mutateAsync(),
  };
}
