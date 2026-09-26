import { describe, expect, it } from "vitest";
import {
  createRoutineCategory,
  deleteRoutineCategory,
  getRoutineCategories,
  getRoutineCategoryById,
  updateRoutineCategory,
} from "../application/category-use-cases.js";
import type {
  NewRoutineCategoryInput,
  RoutineCategory,
  UpdateRoutineCategoryInput,
} from "../domain/types.js";
import type { RoutineCategoryRepository } from "../ports/routine-category-repository.js";

class InMemoryRoutineCategoryRepo implements RoutineCategoryRepository {
  public categories = new Map<string, RoutineCategory>();
  public tasks: Array<{ id: string; category: string }> = [];

  constructor() {
    // Seed standard defaults
    const defaults = [
      { id: "routine", name: "Routine", color: "#14b8a6", icon: "Clock", sortOrder: 0 },
      { id: "work", name: "Work", color: "#3b82f6", icon: "Briefcase", sortOrder: 1 },
      { id: "general", name: "General", color: "#6b7280", icon: "CheckSquare", sortOrder: 2 },
    ];
    for (const d of defaults) {
      this.categories.set(d.id, {
        ...d,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async getById(id: string, _userId: string): Promise<RoutineCategory | undefined> {
    return this.categories.get(id);
  }

  async getAll(_userId: string): Promise<RoutineCategory[]> {
    return Array.from(this.categories.values()).sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
  }

  async create(
    id: string,
    input: NewRoutineCategoryInput,
    _userId: string,
  ): Promise<RoutineCategory> {
    const cat: RoutineCategory = {
      id,
      name: input.name,
      color: input.color || "#3b82f6",
      icon: input.icon,
      isDefault: false,
      sortOrder: input.sortOrder ?? 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.categories.set(id, cat);
    return cat;
  }

  async update(
    id: string,
    patch: UpdateRoutineCategoryInput,
    _userId: string,
  ): Promise<RoutineCategory | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;

    const updated: RoutineCategory = {
      ...existing,
      name: patch.name ?? existing.name,
      color: patch.color ?? existing.color,
      icon: patch.icon !== undefined ? patch.icon : existing.icon,
      sortOrder: patch.sortOrder !== undefined ? patch.sortOrder : existing.sortOrder,
      updatedAt: new Date().toISOString(),
    };
    this.categories.set(id, updated);
    return updated;
  }

  async delete(id: string, _userId: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  async countTasksByCategoryId(categoryId: string, _userId: string): Promise<number> {
    return this.tasks.filter((t) => t.category === categoryId).length;
  }

  async reassignTasksCategory(
    fromCategoryId: string,
    toCategoryId: string,
    _userId: string,
  ): Promise<number> {
    let count = 0;
    for (const t of this.tasks) {
      if (t.category === fromCategoryId) {
        t.category = toCategoryId;
        count++;
      }
    }
    return count;
  }
}

describe("Routine Category Use Cases", () => {
  it("lists all seeded routine categories", async () => {
    const repo = new InMemoryRoutineCategoryRepo();
    const categories = await getRoutineCategories(repo, "user1");
    expect(categories.length).toBe(3);
    expect(categories[0].id).toBe("routine");
  });

  it("creates a new custom category", async () => {
    const repo = new InMemoryRoutineCategoryRepo();
    const created = await createRoutineCategory(
      repo,
      {
        name: "Deep Work",
        color: "#8b5cf6",
        icon: "⚡",
        sortOrder: 10,
      },
      "user1",
    );

    expect(created.id.startsWith("rcat_")).toBe(true);
    expect(created.name).toBe("Deep Work");
    expect(created.color).toBe("#8b5cf6");
    expect(created.icon).toBe("⚡");
    expect(created.isDefault).toBe(false);

    const fetched = await getRoutineCategoryById(repo, created.id, "user1");
    expect(fetched?.name).toBe("Deep Work");
  });

  it("updates an existing category", async () => {
    const repo = new InMemoryRoutineCategoryRepo();
    const created = await createRoutineCategory(
      repo,
      { name: "Side Project", color: "#10b981" },
      "user1",
    );

    const updated = await updateRoutineCategory(
      repo,
      created.id,
      { name: "SaaS Project", color: "#ec4899" },
      "user1",
    );

    expect(updated.name).toBe("SaaS Project");
    expect(updated.color).toBe("#ec4899");
  });

  it("deletes a category and reassigns associated tasks to general fallback", async () => {
    const repo = new InMemoryRoutineCategoryRepo();
    const created = await createRoutineCategory(
      repo,
      { name: "Temporary Project", color: "#f59e0b" },
      "user1",
    );

    repo.tasks.push({ id: "t1", category: created.id });
    repo.tasks.push({ id: "t2", category: created.id });

    const result = await deleteRoutineCategory(repo, created.id, "user1", "general");
    expect(result.reassignedCount).toBe(2);
    expect(repo.tasks[0].category).toBe("general");
    expect(repo.tasks[1].category).toBe("general");

    const fetched = await getRoutineCategoryById(repo, created.id, "user1");
    expect(fetched).toBeUndefined();
  });

  it("rejects creating category with empty name", async () => {
    const repo = new InMemoryRoutineCategoryRepo();
    await expect(
      createRoutineCategory(repo, { name: "   ", color: "#3b82f6" }, "user1"),
    ).rejects.toThrow("Category name is required");
  });

  it("rejects updating nonexistent category", async () => {
    const repo = new InMemoryRoutineCategoryRepo();
    await expect(
      updateRoutineCategory(repo, "nonexistent", { name: "New" }, "user1"),
    ).rejects.toThrow("Routine category nonexistent not found");
  });
});
