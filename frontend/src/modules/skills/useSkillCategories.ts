import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { NewSkillAreaInput, SkillArea } from "./types";

export function useSkillAreas() {
  const [areas, setAreas] = useState<SkillArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAreas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSkillAreas();
      setAreas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load skill areas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  const addArea = useCallback(async (input: NewSkillAreaInput) => {
    const newArea = await api.createSkillArea(input);
    setAreas((prev) => [...prev, newArea]);
    return newArea;
  }, []);

  const editArea = useCallback(async (id: string, patch: Partial<NewSkillAreaInput>) => {
    const updated = await api.updateSkillArea(id, patch);
    setAreas((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, []);

  const removeArea = useCallback(async (id: string) => {
    await api.deleteSkillArea(id);
    setAreas((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    areas,
    loading,
    error,
    addArea,
    editArea,
    removeArea,
    refresh: loadAreas,
  };
}
