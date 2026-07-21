import { randomUUID } from "node:crypto";

import { tasksOverlap } from "../domain/rules.js";
import type { NewTaskInput, Task } from "../domain/types.js";
import type { TaskRepository } from "../ports/task-repository.js";

export function createTask(
  repo: TaskRepository,
  input: NewTaskInput,
): { task: Task; overlapsWith: Task[] } {
  if (input.startTime >= input.endTime) {
    throw new Error("startTime must be before endTime");
  }

  const id = randomUUID();
  const task = repo.create(id, input);

  const dayTasks = repo.getByDate(input.date);
  const overlapsWith = dayTasks.filter((t) => t.id !== task.id && tasksOverlap(task, t));

  return { task, overlapsWith };
}

export function getDaySchedule(repo: TaskRepository, date: string): Task[] {
  return repo.getByDate(date);
}

export function setTaskStatus(repo: TaskRepository, id: string, status: Task["status"]): Task {
  const task = repo.updateStatus(id, status);
  if (!task) throw new Error(`Task ${id} not found`);
  return task;
}

export function updateTask(repo: TaskRepository, id: string, patch: Partial<NewTaskInput>): Task {
  if (patch.startTime !== undefined && patch.endTime !== undefined) {
    if (patch.startTime >= patch.endTime) {
      throw new Error("startTime must be before endTime");
    }
  }

  const task = repo.update(id, patch);
  if (!task) throw new Error(`Task ${id} not found`);
  return task;
}

export function deleteTask(repo: TaskRepository, id: string): void {
  const deleted = repo.delete(id);
  if (!deleted) throw new Error(`Task ${id} not found`);
}
