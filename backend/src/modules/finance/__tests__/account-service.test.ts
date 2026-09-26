import { beforeEach, describe, expect, it } from "vitest";

import { AccountService } from "../application/account-service.js";
import type { Account, NewAccountInput, Transaction } from "../domain/types.js";
import type { AccountRepository } from "../ports/account-repository.js";
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
    async create(id: string, input: NewAccountInput) {
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
    async update(id: string, patch: Partial<NewAccountInput>) {
      const existing = accounts.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      accounts.set(id, updated);
      return updated;
    },
    async archive(id: string) {
      const account = accounts.get(id);
      if (!account) return false;
      account.archived = true;
      account.updatedAt = new Date().toISOString();
      return true;
    },
    async unarchive(id: string) {
      const account = accounts.get(id);
      if (!account) return false;
      account.archived = false;
      account.updatedAt = new Date().toISOString();
      return true;
    },
    async delete(id: string) {
      return accounts.delete(id);
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

describe("AccountService", () => {
  let service: AccountService;
  let accountRepo: ReturnType<typeof createMockAccountRepo>;
  let transactionRepo: ReturnType<typeof createMockTransactionRepo>;

  beforeEach(() => {
    accountRepo = createMockAccountRepo();
    transactionRepo = createMockTransactionRepo();
    service = new AccountService(accountRepo, transactionRepo);
  });

  it("creates an account", async () => {
    const account = await service.createAccount({ name: "Main Bank", type: "bank" }, "test-user");
    expect(account.name).toBe("Main Bank");
    expect(account.type).toBe("bank");
    expect(account.archived).toBe(false);
    expect(accountRepo.accounts.size).toBe(1);
  });

  it("lists all accounts", async () => {
    await service.createAccount({ name: "Account 1", type: "bank" }, "test-user");
    await service.createAccount({ name: "Account 2", type: "cash" }, "test-user");
    expect(await service.listAccounts("test-user")).toHaveLength(2);
  });

  it("lists only active accounts", async () => {
    const account1 = await service.createAccount({ name: "Active", type: "bank" }, "test-user");
    await service.createAccount({ name: "To Archive", type: "cash" }, "test-user");
    await service.archiveAccount(account1.id, "test-user");
    const active = await service.listActiveAccounts("test-user");
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe("To Archive");
  });

  it("updates an account", async () => {
    const account = await service.createAccount({ name: "Old Name", type: "bank" }, "test-user");
    const updated = await service.updateAccount(account.id, { name: "New Name" }, "test-user");
    expect(updated?.name).toBe("New Name");
  });

  it("archives an account", async () => {
    const account = await service.createAccount({ name: "To Archive", type: "bank" }, "test-user");
    expect(await service.archiveAccount(account.id, "test-user")).toBe(true);
    const archived = await service.getAccount(account.id, "test-user");
    expect(archived?.archived).toBe(true);
  });

  it("gets account balance", async () => {
    const account = await service.createAccount({ name: "Bank", type: "bank" }, "test-user");
    expect(await service.getAccountBalance(account.id, "test-user")).toBe(0);
  });

  it("prevents deleting an account with existing transactions", async () => {
    const account = await service.createAccount({ name: "Bank", type: "bank" }, "test-user");
    const now = new Date().toISOString();
    transactionRepo.mockTransactions.set("tx-1", {
      id: "tx-1",
      accountId: account.id,
      categoryId: "cat-1",
      amountMinor: 500,
      date: now,
      currency: "BDT",
      createdAt: now,
      updatedAt: now,
    });
    await expect(service.deleteAccount(account.id, "test-user")).rejects.toThrow(
      "Cannot delete account with existing transactions. Archive the account instead.",
    );
  });

  it("creates opening balance transaction when initialBalanceMinor is provided", async () => {
    const account = await service.createAccount(
      { name: "Salary Account", type: "bank", initialBalanceMinor: 50000 },
      "test-user",
    );
    expect(account.id).toBeDefined();
    expect(transactionRepo.mockTransactions.size).toBe(1);
    const tx = Array.from(transactionRepo.mockTransactions.values())[0];
    expect(tx.accountId).toBe(account.id);
    expect(tx.amountMinor).toBe(50000);
    expect(tx.categoryId).toBe("cat-system-opening-balance");
  });

  it("allows deleting an account if only opening balance transaction exists", async () => {
    const account = await service.createAccount(
      { name: "Temporary Account", type: "cash", initialBalanceMinor: 20000 },
      "test-user",
    );
    expect(transactionRepo.mockTransactions.size).toBe(1);
    const deleted = await service.deleteAccount(account.id, "test-user");
    expect(deleted).toBe(true);
    expect(accountRepo.accounts.has(account.id)).toBe(false);
    expect(transactionRepo.mockTransactions.size).toBe(0);
  });
});
