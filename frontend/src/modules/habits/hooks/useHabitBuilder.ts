import type { HabitDefinition, NewHabitDefinitionInput } from "@lifeos/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDataSource } from "../../../lib/dataSource.js";
import { queryKeys } from "../../../lib/queryKeys.js";

export function useHabitBuilder() {
  const queryClient = useQueryClient();
  const ds = getDataSource();

  const habitsQuery = useQuery<HabitDefinition[]>({
    queryKey: queryKeys.habits.all(),
    queryFn: () => ds.getHabits(),
  });

  const invalidateHabits = () => {
    queryClient.invalidateQueries({ queryKey: ["habits"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: NewHabitDefinitionInput) => ds.createHabit(data),
    onSuccess: () => invalidateHabits(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HabitDefinition> }) =>
      ds.updateHabit(id, data),
    onSuccess: () => invalidateHabits(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ds.deleteHabit(id),
    onSuccess: () => invalidateHabits(),
  });

  const toggleArchiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const habits = queryClient.getQueryData<HabitDefinition[]>(queryKeys.habits.all());
      const target = habits?.find((h) => h.id === id);
      if (!target) return;
      return ds.updateHabit(id, { archived: !target.archived });
    },
    onSuccess: () => invalidateHabits(),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // update sortOrder for each habit
      for (let i = 0; i < ids.length; i++) {
        await ds.updateHabit(ids[i], { sortOrder: i });
      }
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.all() });
      const previous = queryClient.getQueryData<HabitDefinition[]>(queryKeys.habits.all());
      if (previous) {
        const map = new Map(previous.map((h) => [h.id, h]));
        const reordered: HabitDefinition[] = [];
        for (const id of ids) {
          const item = map.get(id);
          if (item) reordered.push(item);
        }
        queryClient.setQueryData(queryKeys.habits.all(), reordered);
      }
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.habits.all(), context.previous);
      }
    },
    onSettled: () => invalidateHabits(),
  });

  return {
    habits: habitsQuery.data ?? [],
    loading: habitsQuery.isLoading,
    error: habitsQuery.error ? (habitsQuery.error as Error).message : null,
    createHabit: (data: NewHabitDefinitionInput) => createMutation.mutateAsync(data),
    updateHabit: (id: string, data: Partial<HabitDefinition>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteHabit: (id: string) => deleteMutation.mutateAsync(id),
    toggleArchive: (id: string) => toggleArchiveMutation.mutateAsync(id),
    reorderHabits: (ids: string[]) => reorderMutation.mutateAsync(ids),
    refresh: () => habitsQuery.refetch(),
  };
}
