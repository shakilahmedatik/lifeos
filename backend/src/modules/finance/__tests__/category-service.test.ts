import { beforeEach, describe, expect, it } from "vitest";

import { CategoryService } from "../application/category-service.js";
import type { Category, NewCategoryInput, Transaction } from "../domain/types.js";
import type { CategoryRepository } from "../ports/category-repository.js";

import type { TransactionRepository } from "../ports/transaction-repository.js";

function createMockCategoryRepo(): CategoryRepository & { categories: Map<string, Category> } {
  const categories = new Map<string, Category>();
  return {
    categories,
    async getById(id: string) {
      return categories.get(id);
    },
    async getAll() {
      return Array.from(categories.values());
    },
    async getActive() {
      return Array.from(categories.values()).filter((c) => !c.archived);
    },
    async getByKind(kind) {
      return Array.from(categories.values()).filter((c) => !c.archived && c.kind === kind);
    },
    async create(id: string, input: NewCategoryInput) {
      const now = new Date().toISOString();
      const category: Category = {
        id,
        name: input.name,
        kind: input.kind,
        isSystem: Boolean(input.isSystem),
        archived: false,
        createdAt: now,
        updatedAt: now,
      };
      categories.set(id, category);
      return category;
    },
    async update(id: string, patch: Partial<NewCategoryInput>) {
      const existing = categories.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      categories.set(id, updated);
      return updated;
    },
    async archive(id: string) {
      const category = categories.get(id);
      if (!category) return false;
      category.archived = true;
      category.updatedAt = new Date().toISOString();
      return true;
    },
    async unarchive(id: string) {
      const category = categories.get(id);
      if (!category) return false;
      category.archived = false;
      category.updatedAt = new Date().toISOString();
      return true;
    },
    async delete(id: string) {
      return categories.delete(id);
    },
  };
}

function createMockTransactionRepo(): TransactionRepository & {
  mockTransactions: Map<string, Transaction>;
} {
  const mockTransactions = new Map<string, Transaction>();
  return {
    mockTransactions,
    getById: async (id: string) => mockTransactions.get(id),
    getByDateRange: async () => Array.from(mockTransactions.values()),
    getByAccountId: async (accountId: string) =>
      Array.from(mockTransactions.values()).filter((t) => t.accountId === accountId),
    getByAccountAndDateRange: async (accountId: string) =>
      Array.from(mockTransactions.values()).filter((t) => t.accountId === accountId),
    getByCategoryId: async (categoryId: string) =>
      Array.from(mockTransactions.values()).filter((t) => t.categoryId === categoryId),
    create: async (id, input) => {
      const tx = {
        id,
        accountId: input.accountId,
        categoryId: input.categoryId,
        date: input.date,
        amountMinor: input.amountMinor,
        currency: input.currency ?? "BDT",
        note: input.note,
        transferPairId: input.transferPairId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockTransactions.set(id, tx);
      return tx;
    },
    update: async () => undefined,
    delete: async (id: string) => mockTransactions.delete(id),
    getMonthlyTotals: async () => ({ totalIncome: 0, totalExpense: 0 }),
    getCategoryBreakdown: async () => [],
    getAccountBalance: async () => 0,
  };
}

describe("CategoryService", () => {
  let service: CategoryService;
  let categoryRepo: ReturnType<typeof createMockCategoryRepo>;
  let transactionRepo: ReturnType<typeof createMockTransactionRepo>;

  beforeEach(() => {
    categoryRepo = createMockCategoryRepo();
    transactionRepo = createMockTransactionRepo();
    service = new CategoryService(categoryRepo, transactionRepo);
  });

  it("creates a category", async () => {
    const category = await service.createCategory({ name: "Consulting", kind: "income" });
    expect(category.name).toBe("Consulting");
    expect(category.kind).toBe("income");
    expect(category.archived).toBe(false);
  });

  it("rejects creating category with reserved system name", async () => {
    await expect(service.createCategory({ name: "Transfer In", kind: "income" })).rejects.toThrow(
      "reserved system categories",
    );
    await expect(service.createCategory({ name: "transfer out", kind: "expense" })).rejects.toThrow(
      "reserved system categories",
    );
  });

  it("lists categories by kind", async () => {
    await service.createCategory({ name: "Salary", kind: "income" });
    await service.createCategory({ name: "Groceries", kind: "expense" });
    expect(await service.listByKind("income")).toHaveLength(1);
    expect(await service.listByKind("expense")).toHaveLength(1);
  });

  it("lists active categories", async () => {
    const cat = await service.createCategory({ name: "Travel", kind: "expense" });
    await service.createCategory({ name: "Food", kind: "expense" });
    await service.archiveCategory(cat.id);
    const active = await service.listActiveCategories();
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe("Food");
  });

  it("updates a category", async () => {
    const cat = await service.createCategory({ name: "Groceries", kind: "expense" });
    const updated = await service.updateCategory(cat.id, { name: "Supermarket" });
    expect(updated?.name).toBe("Supermarket");
  });

  it("rejects updating a category to a reserved system name", async () => {
    const cat = await service.createCategory({ name: "Groceries", kind: "expense" });
    await expect(service.updateCategory(cat.id, { name: "Transfer Out" })).rejects.toThrow(
      "Cannot rename to reserved system category name",
    );
  });

  it("rejects modifying or archiving or deleting system category", async () => {
    const systemCat = await categoryRepo.create("cat-system-transfer-in", {
      name: "Transfer In",
      kind: "income",
      isSystem: true,
    });

    await expect(service.updateCategory(systemCat.id, { name: "My Transfer" })).rejects.toThrow(
      "Cannot modify system category",
    );
    await expect(service.archiveCategory(systemCat.id)).rejects.toThrow(
      "Cannot archive system category",
    );
    await expect(service.unarchiveCategory(systemCat.id)).rejects.toThrow(
      "Cannot modify system category",
    );
    await expect(service.deleteCategory(systemCat.id)).rejects.toThrow(
      "Cannot delete system category",
    );
  });

  it("archives a category", async () => {
    const cat = await service.createCategory({ name: "Old Category", kind: "expense" });
    expect(await service.archiveCategory(cat.id)).toBe(true);
    expect((await service.getCategory(cat.id))?.archived).toBe(true);
  });

  it("prevents deleting a category with existing transactions", async () => {
    const cat = await service.createCategory({ name: "Shopping", kind: "expense" });
    const now = new Date().toISOString();
    transactionRepo.mockTransactions.set("tx-1", {
      id: "tx-1",
      accountId: "acc-1",
      categoryId: cat.id,
      amountMinor: 1000,
      date: now,
      currency: "BDT",
      createdAt: now,
      updatedAt: now,
    });
    await expect(service.deleteCategory(cat.id)).rejects.toThrow(
      "Cannot delete category with existing transactions. Archive the category instead.",
    );
  });
});
