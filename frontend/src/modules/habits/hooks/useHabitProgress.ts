import type { HabitDailyProgress, PrayerHabitConfig, WaterHabitConfig } from "@lifeos/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { habitApi } from "../api.js";

export function useHabitProgress() {
  const [progresses, setProgresses] = useState<HabitDailyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const notifiedSetRef = useRef<Set<string>>(new Set());

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const data = await habitApi.getTodayProgress();
      setProgresses(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch today's progress");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Handle habit reminder notifications (Prayer time alerts & Water reminders)
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const interval = setInterval(() => {
      if (Notification.permission !== "granted") return;

      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const todayStr = now.toISOString().split("T")[0];

      for (const prog of progresses) {
        const habit = prog.habit;
        if (!habit) continue;

        // Prayer habit reminder
        if (habit.type === "prayer") {
          const config = habit.config as PrayerHabitConfig;
          if (config?.prayers) {
            for (const prayer of config.prayers) {
              if (prayer.time === currentHHMM) {
                const key = `${todayStr}-${habit.id}-${prayer.name}`;
                if (!notifiedSetRef.current.has(key)) {
                  notifiedSetRef.current.add(key);
                  new Notification(`🕌 Time for ${prayer.name} Salah`, {
                    body: `It is now ${prayer.time}. Don't forget to perform your ${prayer.name} prayer.`,
                    icon: "/favicon.ico",
                  });
                }
              }
            }
          }
        }

        // Water habit reminder
        if (habit.type === "water") {
          const config = habit.config as WaterHabitConfig;
          const intervalMins = config?.reminderIntervalMin || 120;
          const target = config?.dailyGoalMl || 2000;
          const current =
            prog.currentValue ??
            ("todayValue" in prog ? (prog as { todayValue?: number }).todayValue : undefined) ??
            0;

          if (current < target) {
            const key = `${todayStr}-${habit.id}-water-${currentHHMM}`;
            // Remind every intervalMins on the hour or matching minute
            if (
              now.getMinutes() === 0 &&
              now.getHours() % Math.max(1, Math.floor(intervalMins / 60)) === 0
            ) {
              if (!notifiedSetRef.current.has(key)) {
                notifiedSetRef.current.add(key);
                new Notification(`💧 Hydration Reminder`, {
                  body: `You've drunk ${current} ml of ${target} ml today. Remember to drink a glass of water!`,
                  icon: "/favicon.ico",
                });
              }
            }
          }
        }
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [progresses]);

  const addLog = async (habitId: string, value: number, meta?: string) => {
    const date = new Date().toISOString().split("T")[0];
    await habitApi.addLog(habitId, { date, value, meta });
    await fetchProgress();
  };

  const removeLog = async (logId: string) => {
    await habitApi.removeLog(logId);
    await fetchProgress();
  };

  return { progresses, loading, error, addLog, removeLog, refresh: fetchProgress };
}
