import type { NewTaskInput, Task } from "../domain/types.js";

export interface TaskRepository {
  getById(id: string, userId: string): Promise<Task | undefined>;
  getByDate(date: string, userId: string): Promise<Task[]>;
  getByDateRange(startDate: string, endDate: string, userId: string): Promise<Task[]>;
  getAll(userId: string): Promise<Task[]>;
  create(id: string, input: NewTaskInput, userId: string): Promise<Task>;
  update(id: string, patch: Partial<NewTaskInput>, userId: string): Promise<Task | undefined>;
  updateStatus(id: string, status: Task["status"], userId: string): Promise<Task | undefined>;
  delete(id: string, userId: string): Promise<boolean>;
}
