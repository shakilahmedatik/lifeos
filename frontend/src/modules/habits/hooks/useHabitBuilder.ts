import type { HabitDefinition, NewHabitDefinitionInput } from "@lifeos/contracts";
import { useCallback, useEffect, useState } from "react";
import { habitApi } from "../api.js";

export function useHabitBuilder() {
  const [habits, setHabits] = useState<HabitDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true);
      const data = await habitApi.getHabits();
      setHabits(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch habits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const createHabit = async (data: NewHabitDefinitionInput) => {
    const newHabit = await habitApi.createHabit(data);
    setHabits((prev) => [...prev, newHabit]);
    return newHabit;
  };

  const updateHabit = async (id: string, data: Partial<HabitDefinition>) => {
    const updated = await habitApi.updateHabit(id, data);
    setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
    return updated;
  };

  const deleteHabit = async (id: string) => {
    await habitApi.deleteHabit(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const toggleArchive = async (id: string) => {
    const target = habits.find((h) => h.id === id);
    if (!target) return;
    const newArchivedState = !target.archived;
    await habitApi.toggleArchive(id, newArchivedState);
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, archived: newArchivedState } : h)));
  };

  const reorderHabits = async (ids: string[]) => {
    setHabits((prev) => {
      const map = new Map(prev.map((h) => [h.id, h]));
      const result: HabitDefinition[] = [];
      for (const id of ids) {
        const item = map.get(id);
        if (item) result.push(item);
      }
      return result;
    });

    const orders = ids.map((id, index) => ({ id, sortOrder: index }));
    await habitApi.reorderHabits(orders);
  };

  return {
    habits,
    loading,
    error,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleArchive,
    reorderHabits,
    refresh: fetchHabits,
  };
}
