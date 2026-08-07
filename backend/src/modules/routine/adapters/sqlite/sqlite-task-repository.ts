import type { Client } from "@libsql/client";
import { getDayOfWeekIndex, isWeekday } from "@lifeos/contracts";

import { isOvernightTask } from "../../domain/rules.js";
import type { NewTaskInput, Task, TaskRecurrence, TaskSubtask } from "../../domain/types.js";
import type { TaskRepository } from "../../ports/task-repository.js";

interface TaskRow {
  id: string;
  title: string;
  category: Task["category"];
  date: string;
  start_time: string;
  end_time: string;
  status: Task["status"];
  notes: string | null;
  reminder_minutes_before: number | null;
  reminder_sound: number;
  recurrence: TaskRecurrence;
  subtasks?: string | null;
  reference_id?: string | null;
  created_at: string;
  updated_at: string;
}

function parseSubtasks(raw?: string | null): TaskSubtask[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function rowToTask(row: TaskRow, dateOverride?: string): Task {
  const startTime = row.start_time;
  const endTime = row.end_time;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    date: dateOverride ?? row.date,
    startTime,
    endTime,
    status: row.status,
    notes: row.notes ?? undefined,
    reminderMinutesBefore: row.reminder_minutes_before ?? undefined,
    reminderSilent: row.reminder_sound !== 1,
    recurrence: row.recurrence ?? "none",
    isOvernight: isOvernightTask(startTime, endTime),
    subtasks: parseSubtasks(row.subtasks),
    referenceId: row.reference_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteTaskRepository implements TaskRepository {
  constructor(private readonly client: Client) {}

  async getById(id: string, userId: string): Promise<Task | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM tasks WHERE id = ? AND (user_id = ? OR user_id = '' OR user_id IS NULL)",
      args: [id, userId],
    });
    const row = res.rows[0] as unknown as TaskRow | undefined;
    return row ? rowToTask(row) : undefined;
  }

  async getByDate(date: string, userId: string): Promise<Task[]> {
    // 1. Direct date tasks
    const directRes = await this.client.execute({
      sql: "SELECT * FROM tasks WHERE date = ? AND (user_id = ? OR user_id = '' OR user_id IS NULL)",
      args: [date, userId],
    });
    const directRows = directRes.rows as unknown as TaskRow[];

    const taskMap = new Map<string, Task>();
    for (const r of directRows) {
      taskMap.set(r.id, rowToTask(r));
    }

    // 2. Recurring tasks starting on or before date
    const recurringRes = await this.client.execute({
      sql: "SELECT * FROM tasks WHERE recurrence != 'none' AND date <= ? AND (user_id = ? OR user_id = '' OR user_id IS NULL)",
      args: [date, userId],
    });
    const recurringRows = recurringRes.rows as unknown as TaskRow[];

    const targetDayIndex = getDayOfWeekIndex(date);
    const targetIsWeekday = isWeekday(date, "bd"); // Bangladesh: Sun-Thu

    for (const r of recurringRows) {
      if (taskMap.has(r.id)) continue; // Already added as direct date

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

    const tasks = Array.from(taskMap.values());
    return tasks.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async getByDateRange(startDate: string, endDate: string, userId: string): Promise<Task[]> {
    const directRes = await this.client.execute({
      sql: "SELECT * FROM tasks WHERE date >= ? AND date <= ? AND (user_id = ? OR user_id = '' OR user_id IS NULL)",
      args: [startDate, endDate, userId],
    });
    const directRows = directRes.rows as unknown as TaskRow[];

    const taskMap = new Map<string, Task>();
    for (const r of directRows) {
      taskMap.set(`${r.id}_${r.date}`, rowToTask(r));
    }

    const recurringRes = await this.client.execute({
      sql: "SELECT * FROM tasks WHERE recurrence != 'none' AND date <= ? AND (user_id = ? OR user_id = '' OR user_id IS NULL)",
      args: [endDate, userId],
    });
    const recurringRows = recurringRes.rows as unknown as TaskRow[];

    // Iterate through dates in date range to find matching recurring tasks
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

    const tasks = Array.from(taskMap.values());
    return tasks.sort(
      (a, b) => b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime),
    );
  }

  async getAll(userId: string): Promise<Task[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM tasks WHERE user_id = ? OR user_id = '' OR user_id IS NULL ORDER BY date DESC, start_time ASC",
      args: [userId],
    });
    const rows = res.rows as unknown as TaskRow[];
    return rows.map((r) => rowToTask(r));
  }

  async create(id: string, input: NewTaskInput, userId: string): Promise<Task> {
    const now = new Date().toISOString();
    const subtasksJson = JSON.stringify(input.subtasks ?? []);

    await this.client.execute({
      sql: `INSERT INTO tasks (id, title, category, date, start_time, end_time, status, notes, reminder_minutes_before, reminder_sound, recurrence, subtasks, reference_id, user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'planned', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        input.title,
        input.category ?? "general",
        input.date,
        input.startTime,
        input.endTime,
        input.notes ?? null,
        input.reminderMinutesBefore ?? null,
        input.reminderSilent ? 0 : 1,
        input.recurrence ?? "none",
        subtasksJson,
        input.referenceId ?? null,
        userId,
        now,
        now,
      ],
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

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (patch.title !== undefined) {
      fields.push("title = ?");
      values.push(patch.title);
    }
    if (patch.category !== undefined) {
      fields.push("category = ?");
      values.push(patch.category);
    }
    if (patch.date !== undefined) {
      fields.push("date = ?");
      values.push(patch.date);
    }
    if (patch.startTime !== undefined) {
      fields.push("start_time = ?");
      values.push(patch.startTime);
    }
    if (patch.endTime !== undefined) {
      fields.push("end_time = ?");
      values.push(patch.endTime);
    }
    if (patch.notes !== undefined) {
      fields.push("notes = ?");
      values.push(patch.notes);
    }
    if (patch.reminderMinutesBefore !== undefined) {
      fields.push("reminder_minutes_before = ?");
      values.push(patch.reminderMinutesBefore ?? null);
    }
    if (patch.reminderSilent !== undefined) {
      fields.push("reminder_sound = ?");
      values.push(patch.reminderSilent ? 0 : 1);
    }
    if (patch.recurrence !== undefined) {
      fields.push("recurrence = ?");
      values.push(patch.recurrence);
    }
    if (patch.subtasks !== undefined) {
      fields.push("subtasks = ?");
      values.push(JSON.stringify(patch.subtasks));
    }
    if (patch.referenceId !== undefined) {
      fields.push("reference_id = ?");
      values.push(patch.referenceId ?? null);
    }

    if (fields.length === 0) return existing;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);
    values.push(userId);

    await this.client.execute({
      sql: `UPDATE tasks SET ${fields.join(", ")} WHERE id = ? AND (user_id = ? OR user_id = '' OR user_id IS NULL)`,
      args: values,
    });

    return await this.getById(id, userId);
  }

  async updateStatus(
    id: string,
    status: Task["status"],
    userId: string,
  ): Promise<Task | undefined> {
    const existing = await this.getById(id, userId);
    if (!existing) return undefined;

    await this.client.execute({
      sql: "UPDATE tasks SET status = ?, updated_at = ? WHERE id = ? AND (user_id = ? OR user_id = '' OR user_id IS NULL)",
      args: [status, new Date().toISOString(), id, userId],
    });

    return await this.getById(id, userId);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const res = await this.client.execute({
      sql: "DELETE FROM tasks WHERE id = ? AND (user_id = ? OR user_id = '' OR user_id IS NULL)",
      args: [id, userId],
    });
    return res.rowsAffected > 0;
  }
}
