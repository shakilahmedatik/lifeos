import type { HabitLogService } from "../../habits/application/habit-log-service.js";
import type { Task } from "../../routine/domain/types.js";

export interface DashboardDependencies {
  taskRepo: {
    getByDate(date: string): Task[];
  };
  habitLogService?: HabitLogService;
}
