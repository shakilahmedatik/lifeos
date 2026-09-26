import type { RoutineStats } from "@lifeos/contracts";
import { useQuery } from "@tanstack/react-query";
import { getDataSource } from "../../../lib/dataSource.js";
import { queryKeys } from "../../../lib/queryKeys.js";

export function useRoutineStats() {
  const ds = getDataSource();

  const statsQuery = useQuery<RoutineStats>({
    queryKey: queryKeys.routine.stats(),
    queryFn: () => ds.getRoutineStats(),
  });

  return {
    stats: statsQuery.data ?? null,
    loading: statsQuery.isLoading,
    error: statsQuery.error ? (statsQuery.error as Error).message : null,
    refetch: () => statsQuery.refetch(),
  };
}
