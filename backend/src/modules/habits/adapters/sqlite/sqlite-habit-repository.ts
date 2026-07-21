import type Database from "better-sqlite3";

import type { Habit, NewHabitInput } from "../../domain/types.js";
import type { HabitRepository } from "../../ports/habit-repository.js";

interface HabitRow {
  id: string;
  name: string;
  frequency: Habit["frequency"];
  target_count: number;
  category: Habit["category"];
  created_at: string;
  updated_at: string;
}

function rowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    frequency: row.frequency,
    targetCount: row.target_count,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteHabitRepository implements HabitRepository {
  constructor(private readonly db: Database.Database) {}

  getById(id: string): Habit | undefined {
    const row = this.db.prepare("SELECT * FROM habits WHERE id = ?").get(id) as
      | HabitRow
      | undefined;
    return row ? rowToHabit(row) : undefined;
  }

  getAll(): Habit[] {
    const rows = this.db
      .prepare("SELECT * FROM habits ORDER BY created_at DESC")
      .all() as HabitRow[];
    return rows.map(rowToHabit);
  }

  getByFrequency(frequency: Habit["frequency"]): Habit[] {
    const rows = this.db
      .prepare("SELECT * FROM habits WHERE frequency = ? ORDER BY created_at DESC")
      .all(frequency) as HabitRow[];
    return rows.map(rowToHabit);
  }

  create(id: string, input: NewHabitInput): Habit {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO habits (id, name, frequency, target_count, category, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.name,
        input.frequency ?? "daily",
        input.targetCount ?? 1,
        input.category ?? "general",
        now,
        now,
      );

    return this.getById(id) as Habit;
  }

  update(id: string, patch: Partial<NewHabitInput>): Habit | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (patch.name !== undefined) {
      fields.push("name = ?");
      values.push(patch.name);
    }
    if (patch.frequency !== undefined) {
      fields.push("frequency = ?");
      values.push(patch.frequency);
    }
    if (patch.targetCount !== undefined) {
      fields.push("target_count = ?");
      values.push(patch.targetCount);
    }
    if (patch.category !== undefined) {
      fields.push("category = ?");
      values.push(patch.category);
    }

    if (fields.length === 0) return existing;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    this.db.prepare(`UPDATE habits SET ${fields.join(", ")} WHERE id = ?`).run(...values);

    return this.getById(id);
  }

  delete(id: string): boolean {
    const result = this.db.prepare("DELETE FROM habits WHERE id = ?").run(id);
    return result.changes > 0;
  }

  getByName(name: string): Habit | undefined {
    const row = this.db.prepare("SELECT * FROM habits WHERE name = ?").get(name) as
      | HabitRow
      | undefined;
    return row ? rowToHabit(row) : undefined;
  }
}
