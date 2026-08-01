import Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

import { SqliteCategoryRepository } from "../adapters/sqlite/sqlite-category-repository.js";

function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

describe("SqliteCategoryRepository", () => {
  let db: Database.Database;
  let repo: SqliteCategoryRepository;

  beforeEach(() => {
    db = createTestDb();
    repo = new SqliteCategoryRepository(db);
  });

  it("creates and retrieves a category", () => {
    const category = repo.create("cat-1", { name: "Salary", kind: "income" });
    expect(category.id).toBe("cat-1");
    expect(category.name).toBe("Salary");
    expect(category.kind).toBe("income");
    expect(category.archived).toBe(false);

    const fetched = repo.getById("cat-1");
    expect(fetched).toEqual(category);
  });

  it("gets active and kind-filtered categories", () => {
    repo.create("cat-1", { name: "Salary", kind: "income" });
    repo.create("cat-2", { name: "Rent", kind: "expense" });
    repo.create("cat-3", { name: "Bonus", kind: "income" });
    repo.archive("cat-3");

    expect(repo.getAll()).toHaveLength(3);
    expect(repo.getActive()).toHaveLength(2);
    expect(repo.getByKind("income")).toHaveLength(1);
    expect(repo.getByKind("expense")).toHaveLength(1);
  });

  it("updates and archives a category", () => {
    repo.create("cat-1", { name: "Food", kind: "expense" });
    const updated = repo.update("cat-1", { name: "Dining & Groceries" });
    expect(updated?.name).toBe("Dining & Groceries");

    const archived = repo.archive("cat-1");
    expect(archived).toBe(true);
    expect(repo.getById("cat-1")?.archived).toBe(true);
  });
});
