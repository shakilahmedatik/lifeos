import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api.js";
import type { LearningLog, NewLearningLogInput, UpdateLearningLogInput } from "../types.js";

export function useLearningLogs(resourceId?: string) {
  const [logs, setLogs] = useState<LearningLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (resourceId) {
        const data = await api.getLearningLogsByResource(resourceId);
        setLogs(data);
      } else {
        const today = new Date().toISOString().split("T")[0];
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        const data = await api.getLearningLogsByRange(monthAgo, today);
        setLogs(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [resourceId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const addLog = useCallback(async (input: NewLearningLogInput) => {
    try {
      setError(null);
      const newLog = await api.logLearningSession(input);
      setLogs((prev) => [newLog, ...prev]);
      return newLog;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to log session";
      setError(msg);
      throw err;
    }
  }, []);

  const editLog = useCallback(async (id: string, patch: UpdateLearningLogInput) => {
    try {
      setError(null);
      const updated = await api.updateLearningLog(id, patch);
      setLogs((prev) => prev.map((l) => (l.id === id ? updated : l)));
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update log";
      setError(msg);
      throw err;
    }
  }, []);

  const removeLog = useCallback(async (id: string) => {
    try {
      setError(null);
      await api.deleteLearningLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete log";
      setError(msg);
      throw err;
    }
  }, []);

  return {
    logs,
    loading,
    error,
    addLog,
    editLog,
    removeLog,
    refresh: loadLogs,
  };
}
