import { type Client, createClient } from "@libsql/client";
import { beforeEach, describe, expect, it } from "vitest";
import { SqliteRoutineCategoryRepository } from "../adapters/sqlite/sqlite-routine-category-repository.js";

async function createTestClient(): Promise<Client> {
  const client = createClient({ url: ":memory:" });
  await client.execute(`
    CREATE TABLE routine_categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#3b82f6',
      icon TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );
  `);
  await client.execute(`
    CREATE TABLE tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned',
      notes TEXT,
      reminder_minutes_before INTEGER,
      reminder_sound INTEGER NOT NULL DEFAULT 1,
      recurrence TEXT NOT NULL DEFAULT 'none',
      subtasks TEXT DEFAULT '[]',
      reference_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );
  `);
  return client;
}

describe("SqliteRoutineCategoryRepository", () => {
  let client: Client;
  let repo: SqliteRoutineCategoryRepository;

  beforeEach(async () => {
    client = await createTestClient();
    repo = new SqliteRoutineCategoryRepository(client);
  });

  it("auto-seeds default categories on first access", async () => {
    const categories = await repo.getAll("user-1");
    expect(categories.length).toBe(9);
    expect(categories.map((c) => c.name)).toContain("Routine");
    expect(categories.map((c) => c.name)).toContain("General");
    expect(categories.map((c) => c.name)).toContain("Work");
  });

  it("creates and retrieves custom routine category", async () => {
    const custom = await repo.create(
      "custom-1",
      {
        name: "Creative Design",
        color: "#d946ef",
        icon: "Palette",
      },
      "user-1",
    );

    expect(custom.id).toBe("custom-1");
    expect(custom.name).toBe("Creative Design");
    expect(custom.color).toBe("#d946ef");
    expect(custom.icon).toBe("Palette");

    const fetched = await repo.getById("custom-1", "user-1");
    expect(fetched).toEqual(custom);
  });

  it("updates and deletes routine category with task counting and reassignment", async () => {
    await repo.create(
      "cat-study",
      {
        name: "Study Session",
        color: "#3b82f6",
      },
      "user-1",
    );

    // Insert task referencing cat-study
    await client.execute({
      sql: `INSERT INTO tasks (id, user_id, title, category, date, start_time, end_time)
            VALUES ('task-1', 'user-1', 'Study Math', 'cat-study', '2026-08-16', '10:00', '11:00')`,
    });

    const count = await repo.countTasksByCategoryId("cat-study", "user-1");
    expect(count).toBe(1);

    const reassignCount = await repo.reassignTasksCategory("cat-study", "general", "user-1");
    expect(reassignCount).toBe(1);

    const afterCount = await repo.countTasksByCategoryId("cat-study", "user-1");
    expect(afterCount).toBe(0);

    const deleted = await repo.delete("cat-study", "user-1");
    expect(deleted).toBe(true);

    const fetched = await repo.getById("cat-study", "user-1");
    expect(fetched).toBeUndefined();
  });
});
