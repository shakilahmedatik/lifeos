import type Database from "better-sqlite3";

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
    archived: row.archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteCategoryRepository implements CategoryRepository {
  constructor(private readonly db: Database.Database) {}

  getById(id: string): Category | undefined {
    const row = this.db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as
      | CategoryRow
      | undefined;
    return row ? rowToCategory(row) : undefined;
  }

  getAll(): Category[] {
    const rows = this.db
      .prepare("SELECT * FROM categories ORDER BY kind, name")
      .all() as CategoryRow[];
    return rows.map(rowToCategory);
  }

  getActive(): Category[] {
    const rows = this.db
      .prepare("SELECT * FROM categories WHERE archived = 0 ORDER BY kind, name")
      .all() as CategoryRow[];
    return rows.map(rowToCategory);
  }

  getByKind(kind: Category["kind"]): Category[] {
    const rows = this.db
      .prepare("SELECT * FROM categories WHERE kind = ? AND archived = 0 ORDER BY name")
      .all(kind) as CategoryRow[];
    return rows.map(rowToCategory);
  }

  create(id: string, input: NewCategoryInput): Category {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO categories (id, name, kind, archived, created_at, updated_at)
         VALUES (?, ?, ?, 0, ?, ?)`,
      )
      .run(id, input.name, input.kind, now, now);

    return this.getById(id) as Category;
  }

  update(id: string, patch: Partial<NewCategoryInput>): Category | undefined {
    const existing = this.getById(id);
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

    this.db.prepare(`UPDATE categories SET ${fields.join(", ")} WHERE id = ?`).run(...values);

    return this.getById(id);
  }

  archive(id: string): boolean {
    const result = this.db
      .prepare("UPDATE categories SET archived = 1, updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), id);
    return result.changes > 0;
  }

  unarchive(id: string): boolean {
    const result = this.db
      .prepare("UPDATE categories SET archived = 0, updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), id);
    return result.changes > 0;
  }

  delete(id: string): boolean {
    const result = this.db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
