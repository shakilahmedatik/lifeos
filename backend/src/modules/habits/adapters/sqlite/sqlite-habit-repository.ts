import type { Client } from "@libsql/client";

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
  user_id: string;
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
    archived: Boolean(row.archived),
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

export class SqliteHabitRepository implements HabitRepository {
  constructor(private readonly client: Client) {}

  async getById(id: string, userId: string): Promise<HabitDefinition | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM habits WHERE id = ? AND (user_id = ? OR user_id = '')",
      args: [id, userId],
    });
    const row = res.rows[0] as unknown as HabitRow | undefined;
    return row ? rowToHabit(row) : undefined;
  }

  async getByName(name: string, userId: string): Promise<HabitDefinition | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM habits WHERE LOWER(name) = LOWER(?) AND (user_id = ? OR user_id = '')",
      args: [name, userId],
    });
    const row = res.rows[0] as unknown as HabitRow | undefined;
    return row ? rowToHabit(row) : undefined;
  }

  async getAll(includeArchived = false, userId: string): Promise<HabitDefinition[]> {
    let sql = "SELECT * FROM habits WHERE (user_id = ? OR user_id = '')";
    if (!includeArchived) {
      sql += " AND archived = 0";
    }
    sql += " ORDER BY sort_order ASC, created_at DESC";

    const res = await this.client.execute({
      sql,
      args: [userId],
    });
    const rows = res.rows as unknown as HabitRow[];
    return rows.map(rowToHabit);
  }

  async create(
    id: string,
    input: NewHabitDefinitionInput,
    sortOrder: number,
    userId: string,
  ): Promise<HabitDefinition> {
    const now = new Date().toISOString();
    const frequency = (input as { frequency?: string }).frequency ?? "daily";
    const category = input.category ?? "general";

    try {
      await this.client.execute({
        sql: `INSERT INTO habits (id, user_id, name, type, category, icon, color, config, archived, sort_order, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        args: [
          id,
          userId,
          input.name,
          input.type,
          category,
          input.icon ?? null,
          input.color ?? null,
          JSON.stringify(input.config),
          sortOrder,
          now,
          now,
        ],
      });
    } catch {
      await this.client.execute({
        sql: `INSERT INTO habits (id, user_id, name, frequency, type, icon, color, config, archived, sort_order, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        args: [
          id,
          userId,
          input.name,
          frequency,
          input.type,
          input.icon ?? null,
          input.color ?? null,
          JSON.stringify(input.config),
          sortOrder,
          now,
        ],
      });
    }

    return (await this.getById(id, userId)) as HabitDefinition;
  }

  async update(
    id: string,
    patch: UpdateHabitDefinitionInput,
    userId: string,
  ): Promise<HabitDefinition | undefined> {
    const existing = await this.getById(id, userId);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

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
    const p = patch as Record<string, unknown>;
    if (p.archived !== undefined) {
      fields.push("archived = ?");
      values.push(p.archived ? 1 : 0);
    }
    if (p.sortOrder !== undefined) {
      fields.push("sort_order = ?");
      values.push(p.sortOrder as number);
    }

    if (fields.length === 0) return existing;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);
    values.push(userId);

    try {
      await this.client.execute({
        sql: `UPDATE habits SET ${fields.join(", ")} WHERE id = ? AND (user_id = ? OR user_id = '')`,
        args: values,
      });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("no such column: category") || msg.includes("no such column: updated_at")) {
        try {
          if (msg.includes("category")) {
            await this.client.execute(
              "ALTER TABLE habits ADD COLUMN category TEXT DEFAULT 'general'",
            );
          }
          if (msg.includes("updated_at")) {
            await this.client.execute("ALTER TABLE habits ADD COLUMN updated_at TEXT");
          }
          await this.client.execute({
            sql: `UPDATE habits SET ${fields.join(", ")} WHERE id = ? AND (user_id = ? OR user_id = '')`,
            args: values,
          });
        } catch {
          // Fallback without missing columns
          const cleanFields = fields.filter(
            (f) => !f.startsWith("updated_at") && !f.startsWith("category"),
          );
          const cleanValues: (string | number | null)[] = [];
          if (patch.name !== undefined) cleanValues.push(patch.name);
          if (patch.icon !== undefined) cleanValues.push(patch.icon ?? null);
          if (patch.color !== undefined) cleanValues.push(patch.color ?? null);
          if (patch.config !== undefined) cleanValues.push(JSON.stringify(patch.config));
          cleanValues.push(id);
          cleanValues.push(userId);

          await this.client.execute({
            sql: `UPDATE habits SET ${cleanFields.join(", ")} WHERE id = ? AND (user_id = ? OR user_id = '')`,
            args: cleanValues,
          });
        }
      } else {
        throw err;
      }
    }

    return await this.getById(id, userId);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const res = await this.client.execute({
      sql: "DELETE FROM habits WHERE id = ? AND (user_id = ? OR user_id = '')",
      args: [id, userId],
    });
    return res.rowsAffected > 0;
  }

  async archive(id: string, archived: boolean, userId: string): Promise<void> {
    try {
      await this.client.execute({
        sql: "UPDATE habits SET archived = ?, updated_at = ? WHERE id = ? AND (user_id = ? OR user_id = '')",
        args: [archived ? 1 : 0, new Date().toISOString(), id, userId],
      });
    } catch {
      await this.client.execute({
        sql: "UPDATE habits SET archived = ? WHERE id = ? AND (user_id = ? OR user_id = '')",
        args: [archived ? 1 : 0, id, userId],
      });
    }
  }

  async updateSortOrders(
    updates: { id: string; sortOrder: number }[],
    userId: string,
  ): Promise<void> {
    const now = new Date().toISOString();
    try {
      const statements = updates.map((update) => ({
        sql: "UPDATE habits SET sort_order = ?, updated_at = ? WHERE id = ? AND (user_id = ? OR user_id = '')",
        args: [update.sortOrder, now, update.id, userId],
      }));
      await this.client.batch(statements, "write");
    } catch {
      const statements = updates.map((update) => ({
        sql: "UPDATE habits SET sort_order = ? WHERE id = ? AND (user_id = ? OR user_id = '')",
        args: [update.sortOrder, update.id, userId],
      }));
      await this.client.batch(statements, "write");
    }
  }
}
