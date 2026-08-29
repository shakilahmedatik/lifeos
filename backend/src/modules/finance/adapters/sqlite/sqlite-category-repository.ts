import type { Client } from "@libsql/client";
import { DEFAULT_FINANCE_CATEGORIES } from "@lifeos/contracts";

import type { Category, NewCategoryInput } from "../../domain/types.js";
import type { CategoryRepository } from "../../ports/category-repository.js";

interface CategoryRow {
  id: string;
  name: string;
  kind: Category["kind"];
  is_system?: number;
  archived: number;
  created_at: string;
  updated_at: string;
}

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    isSystem: Boolean(row.is_system),
    archived: Boolean(row.archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteCategoryRepository implements CategoryRepository {
  constructor(private readonly client: Client) {}

  private async ensureDefaults(): Promise<void> {
    const now = new Date().toISOString();
    for (const cat of DEFAULT_FINANCE_CATEGORIES) {
      // Check if category exists with ID or name
      const res = await this.client.execute({
        sql: "SELECT id, is_system FROM categories WHERE id = ? OR lower(name) = lower(?)",
        args: [cat.id, cat.name],
      });
      if (res.rows.length === 0) {
        await this.client.execute({
          sql: `INSERT OR IGNORE INTO categories (id, name, kind, is_system, archived, created_at, updated_at)
                VALUES (?, ?, ?, 1, 0, ?, ?)`,
          args: [cat.id, cat.name, cat.kind, now, now],
        });
      } else {
        const row = res.rows[0] as unknown as { id: string; is_system?: number };
        if (!row.is_system) {
          await this.client.execute({
            sql: "UPDATE categories SET is_system = 1, updated_at = ? WHERE id = ?",
            args: [now, row.id],
          });
        }
      }
    }
  }

  async getById(id: string): Promise<Category | undefined> {
    await this.ensureDefaults();
    const res = await this.client.execute({
      sql: "SELECT * FROM categories WHERE id = ?",
      args: [id],
    });
    const row = res.rows[0] as unknown as CategoryRow | undefined;
    return row ? rowToCategory(row) : undefined;
  }

  async getAll(): Promise<Category[]> {
    await this.ensureDefaults();
    const res = await this.client.execute(
      "SELECT * FROM categories ORDER BY is_system DESC, kind, name",
    );
    const rows = res.rows as unknown as CategoryRow[];
    return rows.map(rowToCategory);
  }

  async getActive(): Promise<Category[]> {
    await this.ensureDefaults();
    const res = await this.client.execute(
      "SELECT * FROM categories WHERE archived = 0 ORDER BY is_system DESC, kind, name",
    );
    const rows = res.rows as unknown as CategoryRow[];
    return rows.map(rowToCategory);
  }

  async getByKind(kind: Category["kind"]): Promise<Category[]> {
    await this.ensureDefaults();
    const res = await this.client.execute({
      sql: "SELECT * FROM categories WHERE kind = ? AND archived = 0 ORDER BY is_system DESC, name",
      args: [kind],
    });
    const rows = res.rows as unknown as CategoryRow[];
    return rows.map(rowToCategory);
  }

  async create(id: string, input: NewCategoryInput): Promise<Category> {
    await this.ensureDefaults();
    const now = new Date().toISOString();
    const isSystem = input.isSystem ? 1 : 0;
    await this.client.execute({
      sql: `INSERT INTO categories (id, name, kind, is_system, archived, created_at, updated_at)
            VALUES (?, ?, ?, ?, 0, ?, ?)`,
      args: [id, input.name, input.kind, isSystem, now, now],
    });

    return (await this.getById(id)) as Category;
  }

  async update(id: string, patch: Partial<NewCategoryInput>): Promise<Category | undefined> {
    await this.ensureDefaults();
    const existing = await this.getById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (patch.name !== undefined) {
      fields.push("name = ?");
      values.push(patch.name);
    }
    if (patch.kind !== undefined) {
      fields.push("kind = ?");
      values.push(patch.kind);
    }

    if (fields.length === 0) return existing;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.client.execute({
      sql: `UPDATE categories SET ${fields.join(", ")} WHERE id = ?`,
      args: values,
    });

    return await this.getById(id);
  }

  async archive(id: string): Promise<boolean> {
    await this.ensureDefaults();
    const res = await this.client.execute({
      sql: "UPDATE categories SET archived = 1, updated_at = ? WHERE id = ? AND is_system = 0",
      args: [new Date().toISOString(), id],
    });
    return res.rowsAffected > 0;
  }

  async unarchive(id: string): Promise<boolean> {
    await this.ensureDefaults();
    const res = await this.client.execute({
      sql: "UPDATE categories SET archived = 0, updated_at = ? WHERE id = ?",
      args: [new Date().toISOString(), id],
    });
    return res.rowsAffected > 0;
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureDefaults();
    const res = await this.client.execute({
      sql: "DELETE FROM categories WHERE id = ? AND is_system = 0",
      args: [id],
    });
    return res.rowsAffected > 0;
  }
}
