import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDataSource } from "../../../lib/dataSource.js";
import { queryKeys } from "../../../lib/queryKeys.js";
import type {
  LearningResource,
  NewLearningResourceInput,
  ResourceWithProgress,
  UpdateLearningResourceInput,
} from "../types.js";

export function useLearningResources() {
  const queryClient = useQueryClient();
  const ds = getDataSource();

  const resourcesQuery = useQuery<LearningResource[]>({
    queryKey: queryKeys.skills.resources(),
    queryFn: () => ds.getLearningResources(),
  });

  const invalidateResources = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.skills.resources() });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
  };

  const addResourceMutation = useMutation({
    mutationFn: (input: NewLearningResourceInput) => ds.createLearningResource(input),
    onSuccess: () => invalidateResources(),
  });

  const editResourceMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateLearningResourceInput }) =>
      ds.updateLearningResource(id, patch),
    onSuccess: () => invalidateResources(),
  });

  const removeResourceMutation = useMutation({
    mutationFn: (id: string) => ds.deleteLearningResource(id),
    onSuccess: () => invalidateResources(),
  });

  const getProgress = async (id: string): Promise<ResourceWithProgress | null> => {
    try {
      return await ds.getResourceProgress(id);
    } catch {
      return null;
    }
  };

  return {
    resources: resourcesQuery.data ?? [],
    loading: resourcesQuery.isLoading,
    error: resourcesQuery.error ? (resourcesQuery.error as Error).message : null,
    addResource: (input: NewLearningResourceInput) => addResourceMutation.mutateAsync(input),
    editResource: (id: string, patch: UpdateLearningResourceInput) =>
      editResourceMutation.mutateAsync({ id, patch }),
    removeResource: (id: string) => removeResourceMutation.mutateAsync(id),
    getProgress,
    refresh: () => resourcesQuery.refetch(),
  };
}
