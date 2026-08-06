import { randomUUID } from "node:crypto";

import { tasksOverlap } from "../domain/rules.js";
import type { NewTaskInput, Task } from "../domain/types.js";
import type { TaskRepository } from "../ports/task-repository.js";

export async function createTask(
  repo: TaskRepository,
  input: NewTaskInput,
  userId: string,
): Promise<{ task: Task; overlapsWith: Task[] }> {
  if (input.startTime === input.endTime) {
    throw new Error("startTime cannot be equal to endTime");
  }

  const id = randomUUID();
  const task = await repo.create(id, input, userId);

  const dayTasks = await repo.getByDate(input.date, userId);
  const overlapsWith = dayTasks.filter((t) => t.id !== task.id && tasksOverlap(task, t));

  return { task, overlapsWith };
}

export async function getDaySchedule(
  repo: TaskRepository,
  date: string,
  userId: string,
): Promise<Task[]> {
  return await repo.getByDate(date, userId);
}

export async function setTaskStatus(
  repo: TaskRepository,
  id: string,
  status: Task["status"],
  userId: string,
): Promise<Task> {
  const task = await repo.updateStatus(id, status, userId);
  if (!task) throw new Error(`Task ${id} not found`);
  return task;
}

export async function updateTask(
  repo: TaskRepository,
  id: string,
  patch: Partial<NewTaskInput>,
  userId: string,
): Promise<{ task: Task; overlapsWith: Task[] }> {
  const existing = await repo.getById(id, userId);
  if (!existing) throw new Error(`Task ${id} not found`);

  const mergedStart = patch.startTime ?? existing.startTime;
  const mergedEnd = patch.endTime ?? existing.endTime;

  if (mergedStart === mergedEnd) {
    throw new Error("startTime cannot be equal to endTime");
  }

  const task = await repo.update(id, patch, userId);
  if (!task) throw new Error(`Task ${id} not found`);

  const dayTasks = await repo.getByDate(task.date, userId);
  const overlapsWith = dayTasks.filter((t) => t.id !== task.id && tasksOverlap(task, t));

  return { task, overlapsWith };
}

export async function deleteTask(repo: TaskRepository, id: string, userId: string): Promise<void> {
  const deleted = await repo.delete(id, userId);
  if (!deleted) throw new Error(`Task ${id} not found`);
}
