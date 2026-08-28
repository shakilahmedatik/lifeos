import type { AccountWithBalance, CategoryBreakdown, MonthlySummary } from "@lifeos/contracts";
import { getClientMonthString } from "@lifeos/contracts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/queryKeys.js";
import * as api from "../api.js";

export function useFinanceSummary(yearMonth?: string) {
  const ym = yearMonth ?? getClientMonthString();

  const summaryQuery = useQuery<MonthlySummary>({
    queryKey: queryKeys.finance.monthlySummary(ym),
    queryFn: () => api.fetchMonthlySummary(ym),
    refetchOnMount: "always",
    staleTime: 0,
  });

  const breakdownQuery = useQuery<CategoryBreakdown[]>({
    queryKey: queryKeys.finance.categoryBreakdown(ym),
    queryFn: () => api.fetchCategoryBreakdown(ym),
    refetchOnMount: "always",
    staleTime: 0,
  });

  const balancesQuery = useQuery<AccountWithBalance[]>({
    queryKey: queryKeys.finance.balances(),
    queryFn: () => api.fetchAccountBalances(),
    refetchOnMount: "always",
    staleTime: 0,
  });

  const isLoading = summaryQuery.isLoading || breakdownQuery.isLoading || balancesQuery.isLoading;
  const error = summaryQuery.error
    ? (summaryQuery.error as Error).message
    : breakdownQuery.error
      ? (breakdownQuery.error as Error).message
      : balancesQuery.error
        ? (balancesQuery.error as Error).message
        : null;

  return {
    summary: summaryQuery.data ?? null,
    breakdown: breakdownQuery.data ?? [],
    balances: balancesQuery.data ?? [],
    loading: isLoading,
    error,
    refresh: async () => {
      await Promise.all([
        summaryQuery.refetch(),
        breakdownQuery.refetch(),
        balancesQuery.refetch(),
      ]);
    },
  };
}
