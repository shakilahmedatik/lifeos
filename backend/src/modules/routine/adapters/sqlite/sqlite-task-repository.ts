import { getDayOfWeekIndex, isWeekday } from "@lifeos/contracts";
import { and, asc, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
import type { DrizzleClient } from "../../../../shared/db.js";
import { tasks } from "../../../../shared/schema.js";
import { isOvernightTask } from "../../domain/rules.js";
import type { NewTaskInput, Task, TaskRecurrence, TaskSubtask } from "../../domain/types.js";
import type { TaskRepository } from "../../ports/task-repository.js";

type TaskRow = typeof tasks.$inferSelect;

function parseSubtasks(raw?: string | null): TaskSubtask[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function rowToTask(row: TaskRow, dateOverride?: string): Task {
  return {
    id: row.id,
    title: row.title,
    category: row.category as Task["category"],
    date: dateOverride ?? row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    status: row.status as Task["status"],
    notes: row.notes ?? undefined,
    recurrence: (row.recurrence ?? "none") as TaskRecurrence,
    isOvernight: isOvernightTask(row.startTime, row.endTime),
    subtasks: parseSubtasks(row.subtasks),
    referenceId: row.referenceId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function userScope(userId: string) {
  return and(
    or(eq(tasks.userId, userId), eq(tasks.userId, ""), sql`${tasks.userId} IS NULL`),
    isNull(tasks.deletedAt),
  );
}

export class DrizzleTaskRepository implements TaskRepository {
  constructor(private readonly db: DrizzleClient) {}

  async getById(id: string, userId: string): Promise<Task | undefined> {
    const [row] = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), userScope(userId)));
    return row ? rowToTask(row) : undefined;
  }

  async getByDate(date: string, userId: string): Promise<Task[]> {
    // 1. Direct date tasks
    const directRows = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.date, date), userScope(userId)));

    const taskMap = new Map<string, Task>();
    for (const r of directRows) {
      taskMap.set(r.id, rowToTask(r));
    }

    // 2. Recurring tasks starting on or before date
    const recurringRows = await this.db
      .select()
      .from(tasks)
      .where(and(sql`${tasks.recurrence} != 'none'`, lte(tasks.date, date), userScope(userId)));

    const targetDayIndex = getDayOfWeekIndex(date);
    const targetIsWeekday = isWeekday(date, "bd");

    for (const r of recurringRows) {
      if (taskMap.has(r.id)) continue;

      let matches = false;
      if (r.recurrence === "daily") {
        matches = true;
      } else if (r.recurrence === "weekdays") {
        matches = targetIsWeekday;
      } else if (r.recurrence === "weekly") {
        matches = getDayOfWeekIndex(r.date) === targetDayIndex;
      }

      if (matches) {
        taskMap.set(r.id, rowToTask(r, date));
      }
    }

    const result = Array.from(taskMap.values());
    return result.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async getByDateRange(startDate: string, endDate: string, userId: string): Promise<Task[]> {
    const { gte, lte: lteFn } = await import("drizzle-orm");
    const directRows = await this.db
      .select()
      .from(tasks)
      .where(and(gte(tasks.date, startDate), lteFn(tasks.date, endDate), userScope(userId)));

    const taskMap = new Map<string, Task>();
    for (const r of directRows) {
      taskMap.set(`${r.id}_${r.date}`, rowToTask(r));
    }

    const recurringRows = await this.db
      .select()
      .from(tasks)
      .where(and(sql`${tasks.recurrence} != 'none'`, lte(tasks.date, endDate), userScope(userId)));

    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    const curr = new Date(start);

    while (curr <= end) {
      const dateStr = curr.toISOString().split("T")[0];
      const targetDayIndex = getDayOfWeekIndex(dateStr);
      const targetIsWeekday = isWeekday(dateStr, "bd");

      for (const r of recurringRows) {
        if (r.date > dateStr) continue;
        const mapKey = `${r.id}_${dateStr}`;
        if (taskMap.has(mapKey)) continue;

        let matches = false;
        if (r.recurrence === "daily") {
          matches = true;
        } else if (r.recurrence === "weekdays") {
          matches = targetIsWeekday;
        } else if (r.recurrence === "weekly") {
          matches = getDayOfWeekIndex(r.date) === targetDayIndex;
        }

        if (matches) {
          taskMap.set(mapKey, rowToTask(r, dateStr));
        }
      }

      curr.setDate(curr.getDate() + 1);
    }

    const result = Array.from(taskMap.values());
    return result.sort(
      (a, b) => b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime),
    );
  }

  async getAll(userId: string): Promise<Task[]> {
    const rows = await this.db
      .select()
      .from(tasks)
      .where(userScope(userId))
      .orderBy(desc(tasks.date), asc(tasks.startTime));
    return rows.map((r) => rowToTask(r));
  }

  async create(id: string, input: NewTaskInput, userId: string): Promise<Task> {
    const now = new Date().toISOString();

    await this.db.insert(tasks).values({
      id,
      userId,
      title: input.title,
      category: input.category ?? "general",
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      status: "planned",
      notes: input.notes ?? null,
      reminderMinutesBefore: null,
      reminderSound: 0,
      recurrence: input.recurrence ?? "none",
      subtasks: JSON.stringify(input.subtasks ?? []),
      referenceId: input.referenceId ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return (await this.getById(id, userId)) as Task;
  }

  async update(
    id: string,
    patch: Partial<NewTaskInput>,
    userId: string,
  ): Promise<Task | undefined> {
    const existing = await this.getById(id, userId);
    if (!existing) return undefined;

    const updates: Record<string, unknown> = {};
    if (patch.title !== undefined) updates.title = patch.title;
    if (patch.category !== undefined) updates.category = patch.category;
    if (patch.date !== undefined) updates.date = patch.date;
    if (patch.startTime !== undefined) updates.startTime = patch.startTime;
    if (patch.endTime !== undefined) updates.endTime = patch.endTime;
    if (patch.notes !== undefined) updates.notes = patch.notes;
    if (patch.recurrence !== undefined) updates.recurrence = patch.recurrence;
    if (patch.subtasks !== undefined) updates.subtasks = JSON.stringify(patch.subtasks);
    if (patch.referenceId !== undefined) updates.referenceId = patch.referenceId ?? null;

    if (Object.keys(updates).length === 0) return existing;

    updates.updatedAt = new Date().toISOString();

    await this.db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, id), userScope(userId)));

    return await this.getById(id, userId);
  }

  async updateStatus(
    id: string,
    status: Task["status"],
    userId: string,
  ): Promise<Task | undefined> {
    const existing = await this.getById(id, userId);
    if (!existing) return undefined;

    await this.db
      .update(tasks)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(and(eq(tasks.id, id), userScope(userId)));

    return await this.getById(id, userId);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .update(tasks)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(tasks.id, id), userScope(userId)));
    return result.rowsAffected > 0;
  }
}
