import { getDayOfWeekIndex, isWeekday } from "@lifeos/contracts";
import type Database from "better-sqlite3";

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
  constructor(private readonly db: Database.Database) {}

  getById(id: string): Task | undefined {
    const row = this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | undefined;
    return row ? rowToTask(row) : undefined;
  }

  getByDate(date: string): Task[] {
    // 1. Direct date tasks
    const directRows = this.db.prepare("SELECT * FROM tasks WHERE date = ?").all(date) as TaskRow[];

    const taskMap = new Map<string, Task>();
    for (const r of directRows) {
      taskMap.set(r.id, rowToTask(r));
    }

    // 2. Recurring tasks starting on or before date
    const recurringRows = this.db
      .prepare("SELECT * FROM tasks WHERE recurrence != 'none' AND date <= ?")
      .all(date) as TaskRow[];

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

  create(id: string, input: NewTaskInput): Task {
    const now = new Date().toISOString();
    const subtasksJson = JSON.stringify(input.subtasks ?? []);

    this.db
      .prepare(
        `INSERT INTO tasks (id, title, category, date, start_time, end_time, status, notes, reminder_minutes_before, reminder_sound, recurrence, subtasks, reference_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'planned', ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
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
        now,
        now,
      );

    return this.getById(id) as Task;
  }

  update(id: string, patch: Partial<NewTaskInput>): Task | undefined {
    const existing = this.getById(id);
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

    this.db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`).run(...values);

    return this.getById(id);
  }

  updateStatus(id: string, status: Task["status"]): Task | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    this.db
      .prepare("UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?")
      .run(status, new Date().toISOString(), id);

    return this.getById(id);
  }

  delete(id: string): boolean {
    const result = this.db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
