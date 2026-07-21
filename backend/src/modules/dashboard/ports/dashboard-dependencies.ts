import type { Task } from "../../routine/domain/types.js";

export interface DashboardDependencies {
  taskRepo: {
    getByDate(date: string): Task[];
  };
}
