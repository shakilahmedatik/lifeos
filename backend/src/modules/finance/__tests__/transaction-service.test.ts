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
    getById(id: string) {
      return accounts.get(id);
    },
    getAll() {
      return Array.from(accounts.values());
    },
    getActive() {
      return Array.from(accounts.values()).filter((a) => !a.archived);
    },
    create(id: string, input: { name: string; type: Account["type"] }) {
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
    update: () => undefined,
    archive(id: string) {
      const account = accounts.get(id);
      if (!account) return false;
      account.archived = true;
      return true;
    },
  };
}

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
    getByKind(kind: Category["kind"]) {
      return Array.from(categories.values()).filter((c) => c.kind === kind && !c.archived);
    },
    create(id: string, input: { name: string; kind: Category["kind"] }) {
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
    update: () => undefined,
    archive(id: string) {
      const category = categories.get(id);
      if (!category) return false;
      category.archived = true;
      return true;
    },
  };
}

function createMockTransactionRepo(): TransactionRepository & {
  transactions: Map<string, Transaction>;
} {
  const transactions = new Map<string, Transaction>();
  return {
    transactions,
    getById(id: string) {
      return transactions.get(id);
    },
    getByDateRange(_startDate: string, _endDate: string) {
      return Array.from(transactions.values());
    },
    getByAccountId(_accountId: string) {
      return Array.from(transactions.values());
    },
    create(id: string, input: NewTransactionInput) {
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
    update: () => undefined,
    delete(id: string) {
      return transactions.delete(id);
    },
    getMonthlyTotals: () => ({ totalIncome: 0, totalExpense: 0 }),
    getCategoryBreakdown: () => [],
    getAccountBalance: () => 0,
  };
}

describe("TransactionService", () => {
  let service: TransactionService;
  let accountRepo: ReturnType<typeof createMockAccountRepo>;
  let categoryRepo: ReturnType<typeof createMockCategoryRepo>;
  let transactionRepo: ReturnType<typeof createMockTransactionRepo>;

  beforeEach(() => {
    accountRepo = createMockAccountRepo();
    categoryRepo = createMockCategoryRepo();
    transactionRepo = createMockTransactionRepo();
    service = new TransactionService(transactionRepo, accountRepo, categoryRepo);

    // Seed test data
    accountRepo.create("acc-1", { name: "Bank", type: "bank" });
    categoryRepo.create("cat-expense-food", { name: "Food", kind: "expense" });
    categoryRepo.create("cat-income-salary", { name: "Salary", kind: "income" });
  });

  it("creates a transaction", () => {
    const transaction = service.createTransaction({
      accountId: "acc-1",
      categoryId: "cat-expense-food",
      date: "2026-07-22",
      amountMinor: 5000,
    });
    expect(transaction.accountId).toBe("acc-1");
    expect(transaction.amountMinor).toBe(5000);
    expect(transactionRepo.transactions.size).toBe(1);
  });

  it("rejects transaction for non-existent account", () => {
    expect(() =>
      service.createTransaction({
        accountId: "non-existent",
        categoryId: "cat-expense-food",
        date: "2026-07-22",
        amountMinor: 5000,
      }),
    ).toThrow("Account not found");
  });

  it("rejects transaction for archived account", () => {
    accountRepo.archive("acc-1");
    expect(() =>
      service.createTransaction({
        accountId: "acc-1",
        categoryId: "cat-expense-food",
        date: "2026-07-22",
        amountMinor: 5000,
      }),
    ).toThrow("archived account");
  });

  it("rejects transaction for non-existent category", () => {
    expect(() =>
      service.createTransaction({
        accountId: "acc-1",
        categoryId: "non-existent",
        date: "2026-07-22",
        amountMinor: 5000,
      }),
    ).toThrow("Category not found");
  });

  it("rejects zero amount", () => {
    expect(() =>
      service.createTransaction({
        accountId: "acc-1",
        categoryId: "cat-expense-food",
        date: "2026-07-22",
        amountMinor: 0,
      }),
    ).toThrow("Amount must be positive");
  });

  it("creates a transfer between accounts", () => {
    accountRepo.create("acc-2", { name: "Cash", type: "cash" });
    const result = service.createTransfer("acc-1", "acc-2", 100000, "2026-07-22", "ATM withdrawal");
    expect(result.from.accountId).toBe("acc-1");
    expect(result.to.accountId).toBe("acc-2");
    expect(result.from.amountMinor).toBe(100000);
    expect(result.to.amountMinor).toBe(100000);
    expect(result.from.transferPairId).toBe(result.to.transferPairId);
  });

  it("rejects transfer to same account", () => {
    expect(() => service.createTransfer("acc-1", "acc-1", 10000, "2026-07-22")).toThrow(
      "Cannot transfer to the same account",
    );
  });

  it("deletes a transaction", () => {
    const transaction = service.createTransaction({
      accountId: "acc-1",
      categoryId: "cat-expense-food",
      date: "2026-07-22",
      amountMinor: 5000,
    });
    expect(service.deleteTransaction(transaction.id)).toBe(true);
    expect(transactionRepo.transactions.size).toBe(0);
  });
});
