import type {
  NewRoutineCategoryInput,
  RoutineCategory,
  UpdateRoutineCategoryInput,
} from "@lifeos/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppToast } from "../../../components/Toast.js";
import { getDataSource } from "../../../lib/dataSource.js";
import { queryKeys } from "../../../lib/queryKeys.js";

export function useRoutineCategories() {
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const ds = getDataSource();

  const categoriesQuery = useQuery<RoutineCategory[]>({
    queryKey: queryKeys.routine.categories(),
    queryFn: () => ds.getRoutineCategories(),
  });

  const invalidateRoutine = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.routine.categories(),
    });
    queryClient.invalidateQueries({
      queryKey: ["routine"],
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.summary(),
    });
  };

  const createCategoryMutation = useMutation({
    mutationFn: (input: NewRoutineCategoryInput) => ds.createRoutineCategory(input),
    onSuccess: (newCat) => {
      toast.success(`Category "${newCat.name}" created`);
      invalidateRoutine();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create category");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateRoutineCategoryInput }) =>
      ds.updateRoutineCategory(id, patch),
    onSuccess: (updated) => {
      toast.success(`Category "${updated.name}" updated`);
      invalidateRoutine();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update category");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: ({ id, fallback }: { id: string; fallback?: string }) =>
      ds.deleteRoutineCategory(id, fallback),
    onSuccess: () => {
      toast.success("Category deleted");
      invalidateRoutine();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    },
  });

  return {
    categories: categoriesQuery.data ?? [],
    loading: categoriesQuery.isLoading,
    error: categoriesQuery.error ? (categoriesQuery.error as Error).message : null,
    refetch: () => categoriesQuery.refetch(),
    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,
  };
}
