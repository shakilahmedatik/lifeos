import { beforeEach, describe, expect, it } from "vitest";

import { FinanceReportService } from "../application/finance-report-service.js";
import type { Account, Category, Transaction } from "../domain/types.js";
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
    archive: () => false,
    unarchive: () => false,
    delete: () => false,
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
    archive: () => false,
    unarchive: () => false,
    delete: () => false,
  };
}

function createMockTransactionRepo(
  monthlyTotals: { totalIncome: number; totalExpense: number } = {
    totalIncome: 0,
    totalExpense: 0,
  },
  categoryBreakdown: { categoryId: string; total: number }[] = [],
): TransactionRepository & { transactions: Map<string, Transaction> } {
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
    create(id: string, input) {
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
    delete: () => false,
    getMonthlyTotals: () => monthlyTotals,
    getCategoryBreakdown: () => categoryBreakdown,
    getAccountBalance: () => 0,
  };
}

describe("FinanceReportService", () => {
  let accountRepo: ReturnType<typeof createMockAccountRepo>;
  let categoryRepo: ReturnType<typeof createMockCategoryRepo>;
  let transactionRepo: ReturnType<typeof createMockTransactionRepo>;
  let service: FinanceReportService;

  beforeEach(() => {
    accountRepo = createMockAccountRepo();
    categoryRepo = createMockCategoryRepo();
    transactionRepo = createMockTransactionRepo({ totalIncome: 500000, totalExpense: 300000 }, [
      { categoryId: "cat-expense-food", total: 150000 },
    ]);
    service = new FinanceReportService(transactionRepo, accountRepo, categoryRepo);

    // Seed test data
    accountRepo.create("acc-1", { name: "Bank", type: "bank" });
    categoryRepo.create("cat-expense-food", { name: "Food", kind: "expense" });
    categoryRepo.create("cat-income-salary", { name: "Salary", kind: "income" });
  });

  it("gets monthly summary", () => {
    const summary = service.getMonthlySummary("2026-07");
    expect(summary.yearMonth).toBe("2026-07");
    expect(summary.totalIncome).toBe(500000);
    expect(summary.totalExpense).toBe(300000);
    expect(summary.net).toBe(200000);
  });

  it("gets category breakdown", () => {
    const breakdown = service.getCategoryBreakdown("2026-07");
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0].categoryName).toBe("Food");
    expect(breakdown[0].total).toBe(150000);
  });

  it("gets account balances", () => {
    const balances = service.getAccountBalances();
    expect(balances).toHaveLength(1);
    expect(balances[0].name).toBe("Bank");
  });

  it("gets monthly transactions", () => {
    const transactions = service.getMonthlyTransactions("2026-07");
    expect(Array.isArray(transactions)).toBe(true);
  });
});
