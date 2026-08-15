import type { WeeklySummary } from "@lifeos/contracts";
import { useQuery } from "@tanstack/react-query";
import { getDataSource } from "../../../lib/dataSource.js";
import { queryKeys } from "../../../lib/queryKeys.js";

export function useHabitWeeklyReview(weekStart?: string) {
  const { data, isLoading, error } = useQuery<WeeklySummary | null>({
    queryKey: queryKeys.habits.weeklyReview(weekStart),
    queryFn: async () => {
      const ds = getDataSource();
      const res = await ds.getWeeklyReview(weekStart);
      return res || null;
    },
  });

  return { weeklySummary: data ?? null, loading: isLoading, error };
}
