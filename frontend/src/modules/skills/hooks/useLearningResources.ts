import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api.js";
import type {
  LearningResource,
  NewLearningResourceInput,
  ResourceWithProgress,
  UpdateLearningResourceInput,
} from "../types.js";

export function useLearningResources() {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getLearningResources();
      setResources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const addResource = useCallback(async (input: NewLearningResourceInput) => {
    const newResource = await api.createLearningResource(input);
    setResources((prev) => [...prev, newResource]);
    return newResource;
  }, []);

  const editResource = useCallback(async (id: string, patch: UpdateLearningResourceInput) => {
    const updated = await api.updateLearningResource(id, patch);
    setResources((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  }, []);

  const removeResource = useCallback(async (id: string) => {
    await api.deleteLearningResource(id);
    setResources((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const getProgress = useCallback(async (id: string): Promise<ResourceWithProgress | null> => {
    try {
      return await api.getResourceProgress(id);
    } catch {
      return null;
    }
  }, []);

  return {
    resources,
    loading,
    error,
    addResource,
    editResource,
    removeResource,
    getProgress,
    refresh: loadResources,
  };
}
