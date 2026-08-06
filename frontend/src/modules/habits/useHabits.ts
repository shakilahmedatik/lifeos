import type { HabitDefinition, NewHabitDefinitionInput, WeeklySummary } from "@lifeos/contracts";
import { useCallback, useEffect, useState } from "react";
import { habitApi } from "./api.js";

export function useHabits() {
  const [habits, setHabits] = useState<HabitDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHabits = useCallback(async () => {
    try {
      setLoading(true);
      const data = await habitApi.getHabits();
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

  const addHabit = useCallback(async (input: NewHabitDefinitionInput) => {
    const habit = await habitApi.createHabit(input);
    setHabits((prev) => [habit, ...prev]);
    return habit;
  }, []);

  const editHabit = useCallback(async (id: string, patch: Partial<HabitDefinition>) => {
    const habit = await habitApi.updateHabit(id, patch);
    setHabits((prev) => prev.map((h) => (h.id === id ? habit : h)));
    return habit;
  }, []);

  const removeHabit = useCallback(async (id: string) => {
    await habitApi.deleteHabit(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const toggleHabit = useCallback(async (habitId: string, date: string, logged: boolean) => {
    if (logged) {
      await habitApi.removeLogByDate(habitId, date);
    } else {
      await habitApi.addLog(habitId, { date, value: 1 });
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

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await habitApi.getWeeklySummary();
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
