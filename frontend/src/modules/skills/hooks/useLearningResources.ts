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
    try {
      setError(null);
      const newResource = await api.createLearningResource(input);
      setResources((prev) => [...prev, newResource]);
      return newResource;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create resource";
      setError(msg);
      throw err;
    }
  }, []);

  const editResource = useCallback(async (id: string, patch: UpdateLearningResourceInput) => {
    try {
      setError(null);
      const updated = await api.updateLearningResource(id, patch);
      setResources((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update resource";
      setError(msg);
      throw err;
    }
  }, []);

  const removeResource = useCallback(async (id: string) => {
    try {
      setError(null);
      await api.deleteLearningResource(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete resource";
      setError(msg);
      throw err;
    }
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
