import type {
  NewNotificationInput,
  NewTaskInput,
  Task,
  TaskStatus,
  TaskSubtask,
} from "@lifeos/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppToast } from "../../../components/Toast.js";
import { getDataSource } from "../../../lib/dataSource.js";
import { queryKeys } from "../../../lib/queryKeys.js";

export function useRoutineTasks(date: string) {
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const ds = getDataSource();

  const tasksQuery = useQuery<Task[]>({
    queryKey: queryKeys.routine.tasks(date),
    queryFn: () => ds.getTasks(date),
  });

  const invalidateRoutine = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.routine.tasks(date),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.routine.stats(),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.summary(),
    });
  };

  const createTaskMutation = useMutation({
    mutationFn: async (input: NewTaskInput) => {
      const result = await ds.createTask(input);
      if (input.reminderMinutesBefore) {
        try {
          const [y, m, d] = input.date.split("-").map(Number);
          const [hh, mm] = input.startTime.split(":").map(Number);
          const dt = new Date(y, m - 1, d, hh, mm);
          dt.setMinutes(dt.getMinutes() - input.reminderMinutesBefore);

          const soundType = input.reminderSound || (input.reminderSilent ? undefined : "default");

          await ds.createNotification({
            taskId: result.task.id,
            reminderTime: dt.toISOString(),
            soundType: soundType as NewNotificationInput["soundType"],
          });
        } catch {
          toast.warning("Task created, but failed to schedule reminder notification");
        }
      }
      return result;
    },
    onSuccess: (result) => {
      toast.success("Task created successfully");
      if (result.overlapsWith && result.overlapsWith.length > 0) {
        const titles = result.overlapsWith.map((t) => `"${t.title}"`).join(", ");
        toast.warning(`Note: Task overlaps with ${titles}`);
      }
      invalidateRoutine();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      ds.updateTaskStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.routine.tasks(date),
      });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.routine.tasks(date)) || [];
      queryClient.setQueryData<Task[]>(queryKeys.routine.tasks(date), (old = []) =>
        old.map((t) => (t.id === id ? { ...t, status } : t)),
      );
      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.routine.tasks(date), context.previousTasks);
      }
      toast.error("Failed to update task status");
    },
    onSettled: () => invalidateRoutine(),
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<NewTaskInput> }) => {
      const result = await ds.updateTask(id, patch);
      if (result.task.reminderMinutesBefore) {
        try {
          await ds.deleteNotificationsByTaskId(id);
          const [y, m, d] = result.task.date.split("-").map(Number);
          const [hh, mm] = result.task.startTime.split(":").map(Number);
          const dt = new Date(y, m - 1, d, hh, mm);
          dt.setMinutes(dt.getMinutes() - result.task.reminderMinutesBefore);

          const soundType =
            patch.reminderSound || (result.task.reminderSilent ? undefined : "default");

          await ds.createNotification({
            taskId: result.task.id,
            reminderTime: dt.toISOString(),
            soundType: soundType as NewNotificationInput["soundType"],
          });
        } catch {
          // non-blocking warning
        }
      } else if (patch.reminderMinutesBefore === null) {
        try {
          await ds.deleteNotificationsByTaskId(id);
        } catch {
          // ignore error
        }
      }
      return result;
    },
    onSuccess: (result) => {
      toast.success("Task updated");
      if (result.overlapsWith && result.overlapsWith.length > 0) {
        const titles = result.overlapsWith.map((t) => `"${t.title}"`).join(", ");
        toast.warning(`Note: Task overlaps with ${titles}`);
      }
      invalidateRoutine();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update task");
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: ({ taskId, subtasks }: { taskId: string; subtasks: TaskSubtask[] }) =>
      ds.updateTask(taskId, { subtasks }),
    onMutate: async ({ taskId, subtasks }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.routine.tasks(date),
      });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.routine.tasks(date)) || [];
      queryClient.setQueryData<Task[]>(queryKeys.routine.tasks(date), (old = []) =>
        old.map((t) => (t.id === taskId ? { ...t, subtasks } : t)),
      );
      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.routine.tasks(date), context.previousTasks);
      }
    },
    onSettled: () => invalidateRoutine(),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => ds.deleteTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.routine.tasks(date),
      });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.routine.tasks(date)) || [];
      queryClient.setQueryData<Task[]>(queryKeys.routine.tasks(date), (old = []) =>
        old.filter((t) => t.id !== id),
      );
      return { previousTasks };
    },
    onSuccess: () => {
      toast.success("Task deleted");
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.routine.tasks(date), context.previousTasks);
      }
      toast.error("Failed to delete task");
    },
    onSettled: () => invalidateRoutine(),
  });

  return {
    tasks: tasksQuery.data ?? [],
    loading: tasksQuery.isLoading,
    error: tasksQuery.error ? (tasksQuery.error as Error).message : null,
    refetch: () => tasksQuery.refetch(),
    createTask: createTaskMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    toggleSubtask: toggleSubtaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
  };
}
