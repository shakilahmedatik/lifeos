import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { DrizzleClient } from "../../../shared/db.js";
import { createTestDatabase } from "../../../shared/test-db.js";
import { DrizzleRoutineCategoryRepository } from "../adapters/sqlite/sqlite-routine-category-repository.js";

describe("DrizzleRoutineCategoryRepository", () => {
  let db: DrizzleClient;
  let repo: DrizzleRoutineCategoryRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    repo = new DrizzleRoutineCategoryRepository(db);
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

    // Insert task referencing cat-study using Drizzle raw SQL
    await db.run(sql`INSERT INTO tasks (id, user_id, title, category, date, start_time, end_time)
          VALUES ('task-1', 'user-1', 'Study Math', 'cat-study', '2026-08-16', '10:00', '11:00')`);

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
