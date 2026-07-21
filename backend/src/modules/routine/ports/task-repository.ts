import type { NewTaskInput, Task } from "../domain/types.js";

export interface TaskRepository {
  getById(id: string): Task | undefined;
  getByDate(date: string): Task[];
  create(id: string, input: NewTaskInput): Task;
  update(id: string, patch: Partial<NewTaskInput>): Task | undefined;
  updateStatus(id: string, status: Task["status"]): Task | undefined;
  delete(id: string): boolean;
}
