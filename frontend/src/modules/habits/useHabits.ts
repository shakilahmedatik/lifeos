import { useCallback, useEffect, useState } from "react";
import type {
  Habit,
  NewHabitInput,
  WeeklySummary,
} from "../../../../packages/contracts/src/index.js";
import {
  createHabit,
  deleteHabit,
  fetchHabits,
  fetchWeeklySummary,
  logHabit,
  unlogHabit,
  updateHabit,
} from "./api.js";

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHabits = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchHabits();
      setHabits(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load habits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const addHabit = useCallback(async (input: NewHabitInput) => {
    const habit = await createHabit(input);
    setHabits((prev) => [habit, ...prev]);
    return habit;
  }, []);

  const editHabit = useCallback(async (id: string, patch: Partial<NewHabitInput>) => {
    const habit = await updateHabit(id, patch);
    setHabits((prev) => prev.map((h) => (h.id === id ? habit : h)));
    return habit;
  }, []);

  const removeHabit = useCallback(async (id: string) => {
    await deleteHabit(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const toggleHabit = useCallback(async (habitId: string, date: string, logged: boolean) => {
    if (logged) {
      await unlogHabit(habitId, date);
    } else {
      await logHabit(habitId);
    }
  }, []);

  return {
    habits,
    loading,
    error,
    addHabit,
    editHabit,
    removeHabit,
    toggleHabit,
    refresh: loadHabits,
  };
}

export function useWeeklyReview() {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async (weekStart?: string) => {
    try {
      setLoading(true);
      const data = await fetchWeeklySummary(weekStart);
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load weekly summary");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return {
    summary,
    loading,
    error,
    refresh: loadSummary,
  };
}
