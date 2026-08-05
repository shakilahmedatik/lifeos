import type { NewTaskInput, Task } from "../domain/types.js";

export interface TaskRepository {
  getById(id: string, userId: string): Task | undefined;
  getByDate(date: string, userId: string): Task[];
  create(id: string, input: NewTaskInput, userId: string): Task;
  update(id: string, patch: Partial<NewTaskInput>, userId: string): Task | undefined;
  updateStatus(id: string, status: Task["status"], userId: string): Task | undefined;
  delete(id: string, userId: string): boolean;
}
