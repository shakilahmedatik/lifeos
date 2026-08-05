import type { HabitAnalyticsData } from "@lifeos/contracts";
import { useEffect, useState } from "react";
import { habitApi } from "../api.js";

export function useHabitAnalytics(habitId: string, period: "week" | "month" = "week") {
  const [data, setData] = useState<HabitAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!habitId) return;
    setLoading(true);
    habitApi
      .getAnalytics(habitId, period)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [habitId, period]);

  return { data, loading };
}
