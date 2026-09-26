import { getClientDateString, type HabitAnalyticsData } from "@lifeos/contracts";
import { useQuery } from "@tanstack/react-query";
import { getDataSource } from "../../../lib/dataSource.js";
import { queryKeys } from "../../../lib/queryKeys.js";

export function useHabitAnalytics(
  habitId: string,
  period: "week" | "month" = "week",
  endDate?: string,
) {
  const targetEndDate = endDate || getClientDateString();

  const { data, isLoading, error } = useQuery<HabitAnalyticsData | null>({
    queryKey: queryKeys.habits.analytics(habitId, period, targetEndDate),
    queryFn: async () => {
      if (!habitId) return null;
      const ds = getDataSource();
      const res = await ds.getHabitAnalytics(habitId, period, targetEndDate);
      return res || null;
    },
    enabled: Boolean(habitId),
  });

  return { data: data ?? null, loading: isLoading, error };
}
