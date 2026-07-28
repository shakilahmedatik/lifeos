import type { Exercise, NewExerciseInput } from "@lifeos/contracts";
import { useCallback, useEffect, useState } from "react";
import * as api from "../api.js";

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExercises = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.fetchExercises();
      setExercises(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch exercises");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const createExercise = useCallback(async (input: NewExerciseInput) => {
    const exercise = await api.createExercise(input);
    setExercises((prev) => [...prev, exercise]);
    return exercise;
  }, []);

  const updateExercise = useCallback(async (id: string, patch: Partial<NewExerciseInput>) => {
    const exercise = await api.updateExercise(id, patch);
    setExercises((prev) => prev.map((e) => (e.id === id ? exercise : e)));
    return exercise;
  }, []);

  const deleteExercise = useCallback(async (id: string) => {
    await api.deleteExercise(id);
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return {
    exercises,
    loading,
    error,
    createExercise,
    updateExercise,
    deleteExercise,
    refresh: fetchExercises,
  };
}

export function useExerciseProgress(exerciseId: string | null) {
  const [progress, setProgress] = useState<api.ExerciseProgressPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!exerciseId) return;
    try {
      setLoading(true);
      const data = await api.fetchExerciseProgress(exerciseId);
      setProgress(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch progress");
    } finally {
      setLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return { progress, loading, error, refresh: fetchProgress };
}
