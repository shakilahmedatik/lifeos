import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDataSource } from "../../../lib/dataSource.js";
import { queryKeys } from "../../../lib/queryKeys.js";
import type { NewSkillAreaInput, SkillArea } from "../types.js";

export function useSkillAreas() {
  const queryClient = useQueryClient();
  const ds = getDataSource();

  const areasQuery = useQuery<SkillArea[]>({
    queryKey: queryKeys.skills.areas(),
    queryFn: () => ds.getSkillAreas(),
  });

  const invalidateAreas = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.skills.areas() });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
  };

  const addAreaMutation = useMutation({
    mutationFn: (input: NewSkillAreaInput) => ds.createSkillArea(input),
    onSuccess: () => invalidateAreas(),
  });

  const editAreaMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewSkillAreaInput> }) =>
      ds.updateSkillArea(id, patch),
    onSuccess: () => invalidateAreas(),
  });

  const removeAreaMutation = useMutation({
    mutationFn: (id: string) => ds.deleteSkillArea(id),
    onSuccess: () => invalidateAreas(),
  });

  return {
    areas: areasQuery.data ?? [],
    loading: areasQuery.isLoading,
    error: areasQuery.error ? (areasQuery.error as Error).message : null,
    addArea: (input: NewSkillAreaInput) => addAreaMutation.mutateAsync(input),
    editArea: (id: string, patch: Partial<NewSkillAreaInput>) =>
      editAreaMutation.mutateAsync({ id, patch }),
    removeArea: (id: string) => removeAreaMutation.mutateAsync(id),
    refresh: () => areasQuery.refetch(),
  };
}
