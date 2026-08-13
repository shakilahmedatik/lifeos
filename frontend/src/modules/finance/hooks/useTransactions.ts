import type { Transaction } from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/queryKeys.js";
import * as api from "../api.js";

export function useTransactions(startDate?: string, endDate?: string) {
  const sd =
    startDate ??
    (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    })();
  const ed = endDate ?? getClientDateString();

  const query = useQuery<Transaction[]>({
    queryKey: queryKeys.finance.transactionsByRange(sd, ed),
    queryFn: () => api.fetchTransactionsByDateRange(sd, ed),
  });

  return {
    transactions: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: () => query.refetch(),
  };
}
