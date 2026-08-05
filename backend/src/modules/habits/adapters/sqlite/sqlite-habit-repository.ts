import type Database from "better-sqlite3";

import type {
  HabitCategory,
  HabitConfig,
  HabitDefinition,
  HabitType,
  NewHabitDefinitionInput,
  UpdateHabitDefinitionInput,
} from "../../domain/types.js";
import type { HabitRepository } from "../../ports/habit-repository.js";

interface HabitRow {
  id: string;
  name: string;
  type: HabitType;
  category: HabitCategory;
  icon: string | null;
  color: string | null;
  config: string;
  archived: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function rowToHabit(row: HabitRow): HabitDefinition {
  let config: HabitConfig;
  try {
    config = JSON.parse(row.config);
  } catch {
    config = { type: "boolean" };
  }
  return {
    id: row.id,
    name: row.name,
    type: row.type || "boolean",
    category: row.category || "general",
    icon: row.icon || undefined,
    color: row.color || undefined,
    config: config && typeof config === "object" ? config : { type: "boolean" },
    archived: row.archived === 1,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteHabitRepository implements HabitRepository {
  constructor(private readonly db: Database.Database) {}

  getById(id: string): HabitDefinition | undefined {
    const row = this.db.prepare("SELECT * FROM habits WHERE id = ?").get(id) as
      | HabitRow
      | undefined;
    return row ? rowToHabit(row) : undefined;
  }

  getByName(name: string): HabitDefinition | undefined {
    const row = this.db.prepare("SELECT * FROM habits WHERE LOWER(name) = LOWER(?)").get(name) as
      | HabitRow
      | undefined;
    return row ? rowToHabit(row) : undefined;
  }

  getAll(includeArchived = false): HabitDefinition[] {
    let query = "SELECT * FROM habits";
    if (!includeArchived) {
      query += " WHERE archived = 0";
    }
    query += " ORDER BY sort_order ASC, created_at DESC";

    const rows = this.db.prepare(query).all() as HabitRow[];
    return rows.map(rowToHabit);
  }

  create(id: string, input: NewHabitDefinitionInput, sortOrder: number): HabitDefinition {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO habits (id, name, type, category, icon, color, config, archived, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.name,
        input.type,
        input.category ?? "general",
        input.icon ?? null,
        input.color ?? null,
        JSON.stringify(input.config),
        0, // archived
        sortOrder,
        now,
        now,
      );

    return this.getById(id) as HabitDefinition;
  }

  update(id: string, patch: UpdateHabitDefinitionInput): HabitDefinition | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (patch.name !== undefined) {
      fields.push("name = ?");
      values.push(patch.name);
    }
    if (patch.category !== undefined) {
      fields.push("category = ?");
      values.push(patch.category);
    }
    if (patch.icon !== undefined) {
      fields.push("icon = ?");
      values.push(patch.icon ?? null);
    }
    if (patch.color !== undefined) {
      fields.push("color = ?");
      values.push(patch.color ?? null);
    }
    if (patch.config !== undefined) {
      fields.push("config = ?");
      values.push(JSON.stringify(patch.config));
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

  archive(id: string, archived: boolean): void {
    this.db
      .prepare("UPDATE habits SET archived = ?, updated_at = ? WHERE id = ?")
      .run(archived ? 1 : 0, new Date().toISOString(), id);
  }

  updateSortOrders(updates: { id: string; sortOrder: number }[]): void {
    const stmt = this.db.prepare("UPDATE habits SET sort_order = ?, updated_at = ? WHERE id = ?");
    const now = new Date().toISOString();

    this.db.transaction(() => {
      for (const update of updates) {
        stmt.run(update.sortOrder, now, update.id);
      }
    })();
  }
}
