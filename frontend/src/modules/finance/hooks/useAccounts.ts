import type { Account, AccountWithBalance } from "@lifeos/contracts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/queryKeys.js";
import * as api from "../api.js";

export function useAccounts() {
  const query = useQuery<Account[]>({
    queryKey: queryKeys.finance.accounts(),
    queryFn: () => api.fetchAccounts(),
  });

  return {
    accounts: query.data ?? [],
    loading: query.isLoading,
    refresh: () => query.refetch(),
  };
}

export function useActiveAccounts() {
  const query = useQuery<Account[]>({
    queryKey: queryKeys.finance.activeAccounts(),
    queryFn: () => api.fetchActiveAccounts(),
  });

  return {
    accounts: query.data ?? [],
    loading: query.isLoading,
    refresh: () => query.refetch(),
  };
}

export function useAccountBalances() {
  const query = useQuery<AccountWithBalance[]>({
    queryKey: queryKeys.finance.balances(),
    queryFn: () => api.fetchAccountBalances(),
  });

  return {
    accounts: query.data ?? [],
    loading: query.isLoading,
    refresh: () => query.refetch(),
  };
}
