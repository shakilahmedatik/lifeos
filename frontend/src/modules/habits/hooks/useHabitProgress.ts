import {
  getClientDateString,
  type HabitWithStreak,
  type PrayerHabitConfig,
  type WaterHabitConfig,
} from "@lifeos/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getDataSource } from "../../../lib/dataSource.js";
import { queryKeys } from "../../../lib/queryKeys.js";

export function useHabitProgress() {
  const queryClient = useQueryClient();
  const ds = getDataSource();
  const notifiedSetRef = useRef<Set<string>>(new Set());

  const progressQuery = useQuery<HabitWithStreak[]>({
    queryKey: queryKeys.habits.today(),
    queryFn: () => ds.getTodayHabits(),
  });

  const invalidateProgress = () => {
    queryClient.invalidateQueries({ queryKey: ["habits"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const addLogMutation = useMutation({
    mutationFn: ({ habitId, value, meta }: { habitId: string; value: number; meta?: string }) => {
      const date = getClientDateString();
      return ds.logHabit(habitId, date, value, meta);
    },
    onSuccess: () => invalidateProgress(),
  });

  const removeLogMutation = useMutation({
    mutationFn: (logId: string) => ds.unlogHabitByLogId(logId),
    onSuccess: () => invalidateProgress(),
  });

  const progresses = progressQuery.data ?? [];

  // Notification alerts logic for prayer / water habits
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const interval = setInterval(() => {
      if (Notification.permission !== "granted") return;

      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const todayStr = getClientDateString();

      for (const prog of progresses) {
        if (!prog) continue;

        if (prog.type === "prayer") {
          const config = prog.config as PrayerHabitConfig;
          if (config?.prayers) {
            for (const prayer of config.prayers) {
              if (prayer.time === currentHHMM) {
                const key = `${todayStr}-${prog.id}-${prayer.name}`;
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

        if (prog.type === "water") {
          const config = prog.config as WaterHabitConfig;
          const intervalMins = config?.reminderIntervalMin || 120;
          const target = config?.dailyGoalMl || 2000;
          const current = prog.todayValue ?? 0;

          if (current < target) {
            const key = `${todayStr}-${prog.id}-water-${currentHHMM}`;
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

  return {
    progresses,
    loading: progressQuery.isLoading,
    error: progressQuery.error ? (progressQuery.error as Error).message : null,
    addLog: (habitId: string, value = 1, meta?: string) =>
      addLogMutation.mutateAsync({ habitId, value, meta }),
    removeLog: (logId: string) => removeLogMutation.mutateAsync(logId),
    refresh: () => progressQuery.refetch(),
  };
}
