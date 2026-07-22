import { useCallback, useEffect, useState } from "react";
import { createSession, deleteSession, getSessions, updateSession } from "./storage";
import type { LearningSession, NewLearningSessionInput } from "./types";

export function useLearningSessions() {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(() => {
    setLoading(true);
    const data = getSessions();
    setSessions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const addSession = useCallback((input: NewLearningSessionInput) => {
    const newSession = createSession(input);
    setSessions((prev) => [newSession, ...prev]);
    return newSession;
  }, []);

  const editSession = useCallback((id: string, patch: Partial<NewLearningSessionInput>) => {
    const updated = updateSession(id, patch);
    if (updated) {
      setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
    }
    return updated;
  }, []);

  const removeSession = useCallback((id: string) => {
    const success = deleteSession(id);
    if (success) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
    return success;
  }, []);

  return {
    sessions,
    loading,
    addSession,
    editSession,
    removeSession,
    refresh: loadSessions,
  };
}
