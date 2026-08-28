import type {
  NewTransactionInput,
  Transaction,
} from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/queryKeys.js";
import * as api from "../api.js";

export function useTransactions(startDate?: string, endDate?: string) {
  const queryClient = useQueryClient();
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
    refetchOnMount: "always",
    staleTime: 0,
  });

  const invalidateFinance = () => {
    queryClient.invalidateQueries({ queryKey: ["finance"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
  };

  const createTransactionMutation = useMutation({
    mutationFn: (input: NewTransactionInput) => api.createTransaction(input),
    onSuccess: () => invalidateFinance(),
  });

  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewTransactionInput> }) =>
      api.updateTransaction(id, patch),
    onSuccess: () => invalidateFinance(),
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: string) => api.deleteTransaction(id),
    onSuccess: () => invalidateFinance(),
  });

  const createTransferMutation = useMutation({
    mutationFn: ({
      fromAccountId,
      toAccountId,
      amountMinor,
      date,
      note,
    }: {
      fromAccountId: string;
      toAccountId: string;
      amountMinor: number;
      date: string;
      note?: string;
    }) => api.createTransfer(fromAccountId, toAccountId, amountMinor, date, note),
    onSuccess: () => invalidateFinance(),
  });

  return {
    transactions: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: () => query.refetch(),
    invalidate: invalidateFinance,
    createTransaction: createTransactionMutation.mutateAsync,
    updateTransaction: updateTransactionMutation.mutateAsync,
    deleteTransaction: deleteTransactionMutation.mutateAsync,
    createTransfer: createTransferMutation.mutateAsync,
  };
}
