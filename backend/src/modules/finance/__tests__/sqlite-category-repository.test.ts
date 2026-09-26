import { beforeEach, describe, expect, it } from "vitest";
import type { DrizzleClient } from "../../../shared/db.js";
import { createTestDatabase } from "../../../shared/test-db.js";
import { DrizzleCategoryRepository } from "../adapters/sqlite/sqlite-category-repository.js";

describe("DrizzleCategoryRepository", () => {
  let db: DrizzleClient;
  let repo: DrizzleCategoryRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    repo = new DrizzleCategoryRepository(db);
  });

  it("seeds default system categories automatically", async () => {
    const all = await repo.getAll("test-user");
    expect(all).toHaveLength(4);
    expect(all.some((c) => c.name === "Transfer In" && c.isSystem && c.kind === "income")).toBe(
      true,
    );
    expect(all.some((c) => c.name === "Transfer Out" && c.isSystem && c.kind === "expense")).toBe(
      true,
    );
    expect(all.some((c) => c.name === "Opening Balance" && c.isSystem && c.kind === "income")).toBe(
      true,
    );
    expect(
      all.some(
        (c) => c.name === "Opening Balance (Liability)" && c.isSystem && c.kind === "expense",
      ),
    ).toBe(true);
  });

  it("creates and retrieves a user category", async () => {
    const category = await repo.create("cat-1", { name: "Salary", kind: "income" }, "test-user");
    expect(category.id).toBe("cat-1");
    expect(category.name).toBe("Salary");
    expect(category.kind).toBe("income");
    expect(category.isSystem).toBe(false);
    expect(category.archived).toBe(false);

    const fetched = await repo.getById("cat-1", "test-user");
    expect(fetched).toEqual(category);
  });

  it("gets active and kind-filtered categories including system defaults", async () => {
    await repo.create("cat-1", { name: "Salary", kind: "income" }, "test-user");
    await repo.create("cat-2", { name: "Rent", kind: "expense" }, "test-user");
    await repo.create("cat-3", { name: "Bonus", kind: "income" }, "test-user");
    await repo.archive("cat-3", "test-user");

    // 4 default system categories + 3 created categories = 7 total
    expect(await repo.getAll("test-user")).toHaveLength(7);
    // 4 default system categories + 2 active created categories = 6 active
    expect(await repo.getActive("test-user")).toHaveLength(6);
    // Transfer In + Opening Balance (defaults) + Salary (active) = 3
    expect(await repo.getByKind("income", "test-user")).toHaveLength(3);
    // Transfer Out + Opening Balance (Liability) (defaults) + Rent (active) = 3
    expect(await repo.getByKind("expense", "test-user")).toHaveLength(3);
  });

  it("updates and archives a user category", async () => {
    await repo.create("cat-1", { name: "Food", kind: "expense" }, "test-user");
    const updated = await repo.update("cat-1", { name: "Dining & Groceries" }, "test-user");
    expect(updated?.name).toBe("Dining & Groceries");

    const archived = await repo.archive("cat-1", "test-user");
    expect(archived).toBe(true);
    expect((await repo.getById("cat-1", "test-user"))?.archived).toBe(true);
  });

  it("prevents archiving or deleting system categories", async () => {
    const all = await repo.getAll("test-user");
    const systemCat = all.find((c) => c.isSystem);
    expect(systemCat).toBeDefined();
    if (!systemCat) throw new Error("Expected system category to exist");

    const archived = await repo.archive(systemCat.id, "test-user");
    expect(archived).toBe(false);

    const deleted = await repo.delete(systemCat.id, "test-user");
    expect(deleted).toBe(false);
  });
});
