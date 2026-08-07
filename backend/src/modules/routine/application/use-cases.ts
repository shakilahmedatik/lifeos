import { randomUUID } from "node:crypto";
import { getClientDateString, type RoutineStats } from "@lifeos/contracts";

import { durationMinutes, tasksOverlap } from "../domain/rules.js";
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

export async function getTaskHistory(
  repo: TaskRepository,
  query: {
    startDate?: string;
    endDate?: string;
    category?: Task["category"] | "all";
    status?: Task["status"] | "all";
    search?: string;
  },
  userId: string,
): Promise<Task[]> {
  let tasks: Task[];
  if (query.startDate && query.endDate) {
    tasks = await repo.getByDateRange(query.startDate, query.endDate, userId);
  } else {
    tasks = await repo.getAll(userId);
  }

  if (query.category && query.category !== "all") {
    tasks = tasks.filter((t) => t.category === query.category);
  }

  if (query.status && query.status !== "all") {
    tasks = tasks.filter((t) => t.status === query.status);
  }

  if (query.search?.trim()) {
    const q = query.search.toLowerCase().trim();
    tasks = tasks.filter(
      (t) => t.title.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q),
    );
  }

  return tasks;
}

export async function getRoutineStats(repo: TaskRepository, userId: string): Promise<RoutineStats> {
  const allTasks = await repo.getAll(userId);
  const todayStr = getClientDateString();
  const todayTasks = await repo.getByDate(todayStr, userId);

  let completedTasks = 0;
  let plannedTasks = 0;
  let inProgressTasks = 0;
  let skippedTasks = 0;

  let totalScheduledMinutes = 0;
  let completedMinutes = 0;

  const categoryMap: Record<
    string,
    { taskCount: number; totalMinutes: number; completedMinutes: number }
  > = {};

  for (const task of allTasks) {
    const mins = durationMinutes(task);
    totalScheduledMinutes += mins;

    if (task.status === "done") {
      completedTasks++;
      completedMinutes += mins;
    } else if (task.status === "in_progress") {
      inProgressTasks++;
    } else if (task.status === "skipped") {
      skippedTasks++;
    } else {
      plannedTasks++;
    }

    if (!categoryMap[task.category]) {
      categoryMap[task.category] = { taskCount: 0, totalMinutes: 0, completedMinutes: 0 };
    }
    categoryMap[task.category].taskCount++;
    categoryMap[task.category].totalMinutes += mins;
    if (task.status === "done") {
      categoryMap[task.category].completedMinutes += mins;
    }
  }

  const completedTodayCount = todayTasks.filter((t) => t.status === "done").length;
  const totalTodayCount = todayTasks.length;
  const todayCompletionRate =
    totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0;

  const totalTasks = allTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const categoryDistribution = Object.entries(categoryMap).map(([category, data]) => ({
    category: category as Task["category"],
    taskCount: data.taskCount,
    totalMinutes: data.totalMinutes,
    completedMinutes: data.completedMinutes,
  }));

  // Weekly trends (last 7 days)
  const weeklyTrends: { date: string; total: number; completed: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayTasks = await repo.getByDate(dateStr, userId);
    const done = dayTasks.filter((t) => t.status === "done").length;
    weeklyTrends.push({
      date: dateStr,
      total: dayTasks.length,
      completed: done,
    });
  }

  return {
    totalTasks,
    completedTasks,
    plannedTasks,
    inProgressTasks,
    skippedTasks,
    completionRate,
    totalScheduledMinutes,
    completedMinutes,
    completedTodayCount,
    totalTodayCount,
    todayCompletionRate,
    categoryDistribution,
    weeklyTrends,
  };
}
