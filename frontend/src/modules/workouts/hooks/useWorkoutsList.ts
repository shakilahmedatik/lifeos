import type { NewWorkoutInput, Workout, WorkoutWithExercises } from "@lifeos/contracts";
import { useCallback, useEffect, useState } from "react";
import * as api from "../api.js";

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.fetchWorkouts();
      setWorkouts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch workouts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const createWorkout = useCallback(async (input: NewWorkoutInput) => {
    const workout = await api.createWorkout(input);
    setWorkouts((prev) => [workout, ...prev]);
    return workout;
  }, []);

  const updateWorkout = useCallback(async (id: string, patch: Partial<NewWorkoutInput>) => {
    const workout = await api.updateWorkout(id, patch);
    setWorkouts((prev) => prev.map((w) => (w.id === id ? workout : w)));
    return workout;
  }, []);

  const deleteWorkout = useCallback(async (id: string) => {
    await api.deleteWorkout(id);
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return {
    workouts,
    loading,
    error,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    refresh: fetchWorkouts,
  };
}

export function useWorkout(id: string) {
  const [workout, setWorkout] = useState<WorkoutWithExercises | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkout = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.fetchWorkout(id);
      setWorkout(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch workout");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWorkout();
  }, [fetchWorkout]);

  const reorderExercises = useCallback(
    async (exerciseIds: string[]) => {
      await api.reorderWorkoutExercises(id, exerciseIds);
      await fetchWorkout();
    },
    [id, fetchWorkout],
  );

  const updateWorkout = useCallback(
    async (patch: Partial<NewWorkoutInput>) => {
      await api.updateWorkout(id, patch);
      await fetchWorkout();
    },
    [id, fetchWorkout],
  );

  const deleteWorkout = useCallback(async () => {
    await api.deleteWorkout(id);
  }, [id]);

  return {
    workout,
    loading,
    error,
    refresh: fetchWorkout,
    reorderExercises,
    updateWorkout,
    deleteWorkout,
  };
}
