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
      is_system INTEGER NOT NULL DEFAULT 0,
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

  it("seeds default system categories automatically", async () => {
    const all = await repo.getAll();
    expect(all).toHaveLength(2);
    expect(all.some((c) => c.name === "Transfer In" && c.isSystem && c.kind === "income")).toBe(
      true,
    );
    expect(all.some((c) => c.name === "Transfer Out" && c.isSystem && c.kind === "expense")).toBe(
      true,
    );
  });

  it("creates and retrieves a user category", async () => {
    const category = await repo.create("cat-1", { name: "Salary", kind: "income" });
    expect(category.id).toBe("cat-1");
    expect(category.name).toBe("Salary");
    expect(category.kind).toBe("income");
    expect(category.isSystem).toBe(false);
    expect(category.archived).toBe(false);

    const fetched = await repo.getById("cat-1");
    expect(fetched).toEqual(category);
  });

  it("gets active and kind-filtered categories including system defaults", async () => {
    await repo.create("cat-1", { name: "Salary", kind: "income" });
    await repo.create("cat-2", { name: "Rent", kind: "expense" });
    await repo.create("cat-3", { name: "Bonus", kind: "income" });
    await repo.archive("cat-3");

    // 2 default system categories + 3 created categories = 5 total
    expect(await repo.getAll()).toHaveLength(5);
    // 2 default system categories + 2 active created categories = 4 active
    expect(await repo.getActive()).toHaveLength(4);
    // Transfer In (default) + Salary (active) = 2
    expect(await repo.getByKind("income")).toHaveLength(2);
    // Transfer Out (default) + Rent (active) = 2
    expect(await repo.getByKind("expense")).toHaveLength(2);
  });

  it("updates and archives a user category", async () => {
    await repo.create("cat-1", { name: "Food", kind: "expense" });
    const updated = await repo.update("cat-1", { name: "Dining & Groceries" });
    expect(updated?.name).toBe("Dining & Groceries");

    const archived = await repo.archive("cat-1");
    expect(archived).toBe(true);
    expect((await repo.getById("cat-1"))?.archived).toBe(true);
  });

  it("prevents archiving or deleting system categories", async () => {
    const all = await repo.getAll();
    const systemCat = all.find((c) => c.isSystem);
    expect(systemCat).toBeDefined();

    const archived = await repo.archive(systemCat!.id);
    expect(archived).toBe(false);

    const deleted = await repo.delete(systemCat!.id);
    expect(deleted).toBe(false);
  });
});
