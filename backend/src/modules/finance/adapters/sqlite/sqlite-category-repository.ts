import type { Client } from "@libsql/client";

import type { Category, NewCategoryInput } from "../../domain/types.js";
import type { CategoryRepository } from "../../ports/category-repository.js";

interface CategoryRow {
  id: string;
  name: string;
  kind: Category["kind"];
  archived: number;
  created_at: string;
  updated_at: string;
}

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    archived: Boolean(row.archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteCategoryRepository implements CategoryRepository {
  constructor(private readonly client: Client) {}

  async getById(id: string): Promise<Category | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM categories WHERE id = ?",
      args: [id],
    });
    const row = res.rows[0] as unknown as CategoryRow | undefined;
    return row ? rowToCategory(row) : undefined;
  }

  async getAll(): Promise<Category[]> {
    const res = await this.client.execute("SELECT * FROM categories ORDER BY kind, name");
    const rows = res.rows as unknown as CategoryRow[];
    return rows.map(rowToCategory);
  }

  async getActive(): Promise<Category[]> {
    const res = await this.client.execute(
      "SELECT * FROM categories WHERE archived = 0 ORDER BY kind, name",
    );
    const rows = res.rows as unknown as CategoryRow[];
    return rows.map(rowToCategory);
  }

  async getByKind(kind: Category["kind"]): Promise<Category[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM categories WHERE kind = ? AND archived = 0 ORDER BY name",
      args: [kind],
    });
    const rows = res.rows as unknown as CategoryRow[];
    return rows.map(rowToCategory);
  }

  async create(id: string, input: NewCategoryInput): Promise<Category> {
    const now = new Date().toISOString();
    await this.client.execute({
      sql: `INSERT INTO categories (id, name, kind, archived, created_at, updated_at)
            VALUES (?, ?, ?, 0, ?, ?)`,
      args: [id, input.name, input.kind, now, now],
    });

    return (await this.getById(id)) as Category;
  }

  async update(id: string, patch: Partial<NewCategoryInput>): Promise<Category | undefined> {
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
    const res = await this.client.execute({
      sql: "UPDATE categories SET archived = 1, updated_at = ? WHERE id = ?",
      args: [new Date().toISOString(), id],
    });
    return res.rowsAffected > 0;
  }

  async unarchive(id: string): Promise<boolean> {
    const res = await this.client.execute({
      sql: "UPDATE categories SET archived = 0, updated_at = ? WHERE id = ?",
      args: [new Date().toISOString(), id],
    });
    return res.rowsAffected > 0;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.client.execute({
      sql: "DELETE FROM categories WHERE id = ?",
      args: [id],
    });
    return res.rowsAffected > 0;
  }
}
