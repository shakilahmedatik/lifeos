import { beforeEach, describe, expect, it } from "vitest";

import { CategoryService } from "../application/category-service.js";
import type { Category, NewCategoryInput } from "../domain/types.js";
import type { CategoryRepository } from "../ports/category-repository.js";

function createMockCategoryRepo(): CategoryRepository & { categories: Map<string, Category> } {
  const categories = new Map<string, Category>();
  return {
    categories,
    getById(id: string) {
      return categories.get(id);
    },
    getAll() {
      return Array.from(categories.values());
    },
    getActive() {
      return Array.from(categories.values()).filter((c) => !c.archived);
    },
    getByKind(kind) {
      return Array.from(categories.values()).filter((c) => !c.archived && c.kind === kind);
    },
    create(id: string, input: NewCategoryInput) {
      const now = new Date().toISOString();
      const category: Category = {
        id,
        name: input.name,
        kind: input.kind,
        archived: false,
        createdAt: now,
        updatedAt: now,
      };
      categories.set(id, category);
      return category;
    },
    update(id: string, patch: Partial<NewCategoryInput>) {
      const existing = categories.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      categories.set(id, updated);
      return updated;
    },
    archive(id: string) {
      const category = categories.get(id);
      if (!category) return false;
      category.archived = true;
      category.updatedAt = new Date().toISOString();
      return true;
    },
    unarchive(id: string) {
      const category = categories.get(id);
      if (!category) return false;
      category.archived = false;
      category.updatedAt = new Date().toISOString();
      return true;
    },
    delete(id: string) {
      return categories.delete(id);
    },
  };
}

describe("CategoryService", () => {
  let service: CategoryService;
  let categoryRepo: ReturnType<typeof createMockCategoryRepo>;

  beforeEach(() => {
    categoryRepo = createMockCategoryRepo();
    service = new CategoryService(categoryRepo);
  });

  it("creates a category", () => {
    const category = service.createCategory({ name: "Consulting", kind: "income" });
    expect(category.name).toBe("Consulting");
    expect(category.kind).toBe("income");
    expect(category.archived).toBe(false);
  });

  it("lists categories by kind", () => {
    service.createCategory({ name: "Salary", kind: "income" });
    service.createCategory({ name: "Groceries", kind: "expense" });
    expect(service.listByKind("income")).toHaveLength(1);
    expect(service.listByKind("expense")).toHaveLength(1);
  });

  it("lists active categories", () => {
    const cat = service.createCategory({ name: "Travel", kind: "expense" });
    service.createCategory({ name: "Food", kind: "expense" });
    service.archiveCategory(cat.id);
    expect(service.listActiveCategories()).toHaveLength(1);
    expect(service.listActiveCategories()[0].name).toBe("Food");
  });

  it("updates a category", () => {
    const cat = service.createCategory({ name: "Groceries", kind: "expense" });
    const updated = service.updateCategory(cat.id, { name: "Supermarket" });
    expect(updated?.name).toBe("Supermarket");
  });

  it("archives a category", () => {
    const cat = service.createCategory({ name: "Old Category", kind: "expense" });
    expect(service.archiveCategory(cat.id)).toBe(true);
    expect(service.getCategory(cat.id)?.archived).toBe(true);
  });
});
