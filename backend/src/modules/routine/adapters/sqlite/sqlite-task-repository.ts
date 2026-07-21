import type Database from "better-sqlite3";

import type { NewTaskInput, Task } from "../../domain/types.js";
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
  created_at: string;
  updated_at: string;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    notes: row.notes ?? undefined,
    reminderMinutesBefore: row.reminder_minutes_before ?? undefined,
    reminderSound: row.reminder_sound === 1,
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
    const rows = this.db
      .prepare("SELECT * FROM tasks WHERE date = ? ORDER BY start_time")
      .all(date) as TaskRow[];
    return rows.map(rowToTask);
  }

  create(id: string, input: NewTaskInput): Task {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO tasks (id, title, category, date, start_time, end_time, status, notes, reminder_minutes_before, reminder_sound, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'planned', ?, ?, ?, ?, ?)`,
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
        input.reminderSound === false ? 0 : 1,
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
      values.push(patch.reminderMinutesBefore);
    }
    if (patch.reminderSound !== undefined) {
      fields.push("reminder_sound = ?");
      values.push(patch.reminderSound ? 1 : 0);
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
