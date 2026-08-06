import type { DashboardSummary, NewReminderInput } from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts/date-utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppToast } from "../../../components/Toast.js";
import { api } from "../../../lib/api.js";

const POLL_INTERVAL = 30_000;

export function useDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pausedRef = useRef(false);
  const toast = useAppToast();

  const fetchSummary = useCallback(async () => {
    try {
      const today = getClientDateString();
      const data = await api.getSummary(today);
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  useEffect(() => {
    const handleVisibility = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden) fetchSummary();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchSummary]);

  const handleHabitLog = async (habitId: string, value: number, meta?: string) => {
    try {
      const today = getClientDateString();
      await api.logHabit(habitId, today, value, meta);
      await fetchSummary();
    } catch {
      toast.error("Failed to log habit");
    }
  };

  const handleHabitUnlog = async (logId: string) => {
    try {
      await api.unlogHabitByLogId(logId);
      await fetchSummary();
    } catch {
      toast.error("Failed to undo habit log");
    }
  };

  const handleCompleteReminder = async (id: string) => {
    try {
      await api.updateReminder(id, { completed: true });
      await fetchSummary();
    } catch {
      toast.error("Failed to update reminder");
    }
  };

  const handleCreateReminder = async (input: NewReminderInput) => {
    try {
      await api.createReminder(input);
      toast.success("Reminder added");
      await fetchSummary();
    } catch {
      toast.error("Failed to create reminder");
    }
  };

  return {
    summary,
    loading,
    error,
    refresh: fetchSummary,
    logHabit: handleHabitLog,
    unlogHabit: handleHabitUnlog,
    completeReminder: handleCompleteReminder,
    createReminder: handleCreateReminder,
  };
}
