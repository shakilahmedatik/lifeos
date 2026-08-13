import type { Category } from "@lifeos/contracts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/queryKeys.js";
import * as api from "../api.js";

export function useCategories() {
  const query = useQuery<Category[]>({
    queryKey: queryKeys.finance.categories(),
    queryFn: () => api.fetchCategories(),
  });

  return {
    categories: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: () => query.refetch(),
  };
}

export function useActiveCategories() {
  const query = useQuery<Category[]>({
    queryKey: queryKeys.finance.activeCategories(),
    queryFn: () => api.fetchActiveCategories(),
  });

  return {
    categories: query.data ?? [],
    loading: query.isLoading,
    refresh: () => query.refetch(),
  };
}
