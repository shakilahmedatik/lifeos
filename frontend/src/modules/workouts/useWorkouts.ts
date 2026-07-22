import { useCallback, useEffect, useState } from "react";

import type {
  Exercise,
  NewExerciseInput,
  NewWorkoutInput,
  Workout,
  WorkoutSession,
  WorkoutSessionWithLogs,
  WorkoutStats,
  WorkoutWithExercises,
} from "../../../../packages/contracts/src/index.js";
import * as api from "./api.js";

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

  return {
    workout,
    loading,
    error,
    refresh: fetchWorkout,
  };
}

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

export function useWorkoutSessions() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.fetchSessions();
      setSessions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refresh: fetchSessions,
  };
}

export function useWorkoutSession(id: string) {
  const [session, setSession] = useState<WorkoutSessionWithLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.fetchSession(id);
      setSession(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch session");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    session,
    loading,
    error,
    refresh: fetchSession,
  };
}

export function useWorkoutStats() {
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.fetchWorkoutStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}
