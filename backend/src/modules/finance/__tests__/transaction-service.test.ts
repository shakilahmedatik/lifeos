import { SYSTEM_CATEGORY_TRANSFER_IN_ID, SYSTEM_CATEGORY_TRANSFER_OUT_ID } from "@lifeos/contracts";
import { beforeEach, describe, expect, it } from "vitest";

import { TransactionService } from "../application/transaction-service.js";
import type { Account, Category, NewTransactionInput, Transaction } from "../domain/types.js";
import type { AccountRepository } from "../ports/account-repository.js";
import type { CategoryRepository } from "../ports/category-repository.js";
import type { TransactionRepository } from "../ports/transaction-repository.js";

function createMockAccountRepo(): AccountRepository & { accounts: Map<string, Account> } {
  const accounts = new Map<string, Account>();
  return {
    accounts,
    async getById(id: string) {
      return accounts.get(id);
    },
    async getAll() {
      return Array.from(accounts.values());
    },
    async getActive() {
      return Array.from(accounts.values()).filter((a) => !a.archived);
    },
    async create(id: string, input: { name: string; type: Account["type"] }) {
      const now = new Date().toISOString();
      const account: Account = {
        id,
        name: input.name,
        type: input.type,
        archived: false,
        createdAt: now,
        updatedAt: now,
      };
      accounts.set(id, account);
      return account;
    },
    update: async () => undefined,
    async archive(id: string) {
      const account = accounts.get(id);
      if (!account) return false;
      account.archived = true;
      return true;
    },
    async unarchive(id: string) {
      const account = accounts.get(id);
      if (!account) return false;
      account.archived = false;
      return true;
    },
    async delete(id: string) {
      return accounts.delete(id);
    },
  };
}

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
    async getByKind(kind: Category["kind"]) {
      return Array.from(categories.values()).filter((c) => c.kind === kind && !c.archived);
    },
    async create(id: string, input: { name: string; kind: Category["kind"]; isSystem?: boolean }) {
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
    update: async () => undefined,
    async archive(id: string) {
      const category = categories.get(id);
      if (!category) return false;
      category.archived = true;
      return true;
    },
    async unarchive(id: string) {
      const category = categories.get(id);
      if (!category) return false;
      category.archived = false;
      return true;
    },
    async delete(id: string) {
      return categories.delete(id);
    },
  };
}

function createMockTransactionRepo(): TransactionRepository & {
  transactions: Map<string, Transaction>;
} {
  const transactions = new Map<string, Transaction>();
  return {
    transactions,
    async getById(id: string) {
      return transactions.get(id);
    },
    async getByDateRange(_startDate: string, _endDate: string) {
      return Array.from(transactions.values());
    },
    async getByAccountId(accountId: string) {
      return Array.from(transactions.values()).filter((t) => t.accountId === accountId);
    },
    async getByAccountAndDateRange(accountId: string) {
      return Array.from(transactions.values()).filter((t) => t.accountId === accountId);
    },
    async getByCategoryId(categoryId: string) {
      return Array.from(transactions.values()).filter((t) => t.categoryId === categoryId);
    },
    async create(id: string, input: NewTransactionInput) {
      const now = new Date().toISOString();
      const transaction: Transaction = {
        id,
        accountId: input.accountId,
        categoryId: input.categoryId,
        date: input.date,
        amountMinor: input.amountMinor,
        currency: input.currency ?? "BDT",
        note: input.note,
        transferPairId: input.transferPairId,
        createdAt: now,
        updatedAt: now,
      };
      transactions.set(id, transaction);
      return transaction;
    },
    update: async () => undefined,
    async delete(id: string) {
      const target = transactions.get(id);
      if (!target) return false;
      if (target.transferPairId) {
        let deletedAny = false;
        for (const [k, t] of Array.from(transactions.entries())) {
          if (t.id === id || t.transferPairId === target.transferPairId) {
            transactions.delete(k);
            deletedAny = true;
          }
        }
        return deletedAny;
      }
      return transactions.delete(id);
    },
    getMonthlyTotals: async () => ({ totalIncome: 0, totalExpense: 0 }),
    getCategoryBreakdown: async () => [],
    getAccountBalance: async () => 0,
  };
}

describe("TransactionService", () => {
  let service: TransactionService;
  let accountRepo: ReturnType<typeof createMockAccountRepo>;
  let categoryRepo: ReturnType<typeof createMockCategoryRepo>;
  let transactionRepo: ReturnType<typeof createMockTransactionRepo>;

  beforeEach(async () => {
    accountRepo = createMockAccountRepo();
    categoryRepo = createMockCategoryRepo();
    transactionRepo = createMockTransactionRepo();
    service = new TransactionService(transactionRepo, accountRepo, categoryRepo);

    // Seed test data
    await accountRepo.create("acc-1", { name: "Bank", type: "bank" });
    await categoryRepo.create("cat-expense-food", { name: "Food", kind: "expense" });
    await categoryRepo.create("cat-income-salary", { name: "Salary", kind: "income" });
  });

  it("creates a transaction", async () => {
    const transaction = await service.createTransaction({
      accountId: "acc-1",
      categoryId: "cat-expense-food",
      date: "2026-07-22",
      amountMinor: 5000,
    });
    expect(transaction.accountId).toBe("acc-1");
    expect(transaction.amountMinor).toBe(5000);
    expect(transactionRepo.transactions.size).toBe(1);
  });

  it("rejects transaction for non-existent account", async () => {
    await expect(
      service.createTransaction({
        accountId: "non-existent",
        categoryId: "cat-expense-food",
        date: "2026-07-22",
        amountMinor: 5000,
      }),
    ).rejects.toThrow("Account not found");
  });

  it("rejects transaction for archived account", async () => {
    await accountRepo.archive("acc-1");
    await expect(
      service.createTransaction({
        accountId: "acc-1",
        categoryId: "cat-expense-food",
        date: "2026-07-22",
        amountMinor: 5000,
      }),
    ).rejects.toThrow("archived account");
  });

  it("rejects transaction for non-existent category", async () => {
    await expect(
      service.createTransaction({
        accountId: "acc-1",
        categoryId: "non-existent",
        date: "2026-07-22",
        amountMinor: 5000,
      }),
    ).rejects.toThrow("Category not found");
  });

  it("rejects zero amount", async () => {
    await expect(
      service.createTransaction({
        accountId: "acc-1",
        categoryId: "cat-expense-food",
        date: "2026-07-22",
        amountMinor: 0,
      }),
    ).rejects.toThrow("Amount must be positive");
  });

  it("creates a transfer between accounts using dedicated transfer categories", async () => {
    await accountRepo.create("acc-2", { name: "Cash", type: "cash" });
    const result = await service.createTransfer(
      "acc-1",
      "acc-2",
      100000,
      "2026-07-22",
      "ATM withdrawal",
    );
    expect(result.from.accountId).toBe("acc-1");
    expect(result.to.accountId).toBe("acc-2");
    expect(result.from.categoryId).toBe(SYSTEM_CATEGORY_TRANSFER_OUT_ID);
    expect(result.to.categoryId).toBe(SYSTEM_CATEGORY_TRANSFER_IN_ID);
    expect(result.from.amountMinor).toBe(100000);
    expect(result.to.amountMinor).toBe(100000);
    expect(result.from.transferPairId).toBe(result.to.transferPairId);
  });

  it("rejects transfer to same account", async () => {
    await expect(service.createTransfer("acc-1", "acc-1", 10000, "2026-07-22")).rejects.toThrow(
      "Cannot transfer to the same account",
    );
  });

  it("deletes a transaction", async () => {
    const transaction = await service.createTransaction({
      accountId: "acc-1",
      categoryId: "cat-expense-food",
      date: "2026-07-22",
      amountMinor: 5000,
    });
    expect(await service.deleteTransaction(transaction.id)).toBe(true);
    expect(transactionRepo.transactions.size).toBe(0);
  });

  it("deleting a transfer transaction reverts both linked transactions", async () => {
    await accountRepo.create("acc-2", { name: "Cash", type: "cash" });
    const { from } = await service.createTransfer("acc-1", "acc-2", 100000, "2026-07-22", "ATM");
    expect(transactionRepo.transactions.size).toBe(2);

    expect(await service.deleteTransaction(from.id)).toBe(true);
    expect(transactionRepo.transactions.size).toBe(0);
  });
});
