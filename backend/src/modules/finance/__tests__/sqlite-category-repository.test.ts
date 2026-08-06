import { type Client, createClient } from "@libsql/client";
import { beforeEach, describe, expect, it } from "vitest";

import { SqliteCategoryRepository } from "../adapters/sqlite/sqlite-category-repository.js";

async function createTestClient(): Promise<Client> {
  const client = createClient({ url: ":memory:" });
  await client.execute(`
    CREATE TABLE categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return client;
}

describe("SqliteCategoryRepository", () => {
  let client: Client;
  let repo: SqliteCategoryRepository;

  beforeEach(async () => {
    client = await createTestClient();
    repo = new SqliteCategoryRepository(client);
  });

  it("creates and retrieves a category", async () => {
    const category = await repo.create("cat-1", { name: "Salary", kind: "income" });
    expect(category.id).toBe("cat-1");
    expect(category.name).toBe("Salary");
    expect(category.kind).toBe("income");
    expect(category.archived).toBe(false);

    const fetched = await repo.getById("cat-1");
    expect(fetched).toEqual(category);
  });

  it("gets active and kind-filtered categories", async () => {
    await repo.create("cat-1", { name: "Salary", kind: "income" });
    await repo.create("cat-2", { name: "Rent", kind: "expense" });
    await repo.create("cat-3", { name: "Bonus", kind: "income" });
    await repo.archive("cat-3");

    expect(await repo.getAll()).toHaveLength(3);
    expect(await repo.getActive()).toHaveLength(2);
    expect(await repo.getByKind("income")).toHaveLength(1);
    expect(await repo.getByKind("expense")).toHaveLength(1);
  });

  it("updates and archives a category", async () => {
    await repo.create("cat-1", { name: "Food", kind: "expense" });
    const updated = await repo.update("cat-1", { name: "Dining & Groceries" });
    expect(updated?.name).toBe("Dining & Groceries");

    const archived = await repo.archive("cat-1");
    expect(archived).toBe(true);
    expect((await repo.getById("cat-1"))?.archived).toBe(true);
  });
});
