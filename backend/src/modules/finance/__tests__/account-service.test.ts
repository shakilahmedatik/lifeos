import { beforeEach, describe, expect, it } from "vitest";

import { AccountService } from "../application/account-service.js";
import type { Account, NewAccountInput } from "../domain/types.js";
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
    const account = await service.createAccount({ name: "Main Bank", type: "bank" });
    expect(account.name).toBe("Main Bank");
    expect(account.type).toBe("bank");
    expect(account.archived).toBe(false);
    expect(accountRepo.accounts.size).toBe(1);
  });

  it("lists all accounts", async () => {
    await service.createAccount({ name: "Account 1", type: "bank" });
    await service.createAccount({ name: "Account 2", type: "cash" });
    expect(await service.listAccounts()).toHaveLength(2);
  });

  it("lists only active accounts", async () => {
    const account1 = await service.createAccount({ name: "Active", type: "bank" });
    await service.createAccount({ name: "To Archive", type: "cash" });
    await service.archiveAccount(account1.id);
    const active = await service.listActiveAccounts();
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe("To Archive");
  });

  it("updates an account", async () => {
    const account = await service.createAccount({ name: "Old Name", type: "bank" });
    const updated = await service.updateAccount(account.id, { name: "New Name" });
    expect(updated?.name).toBe("New Name");
  });

  it("archives an account", async () => {
    const account = await service.createAccount({ name: "To Archive", type: "bank" });
    expect(await service.archiveAccount(account.id)).toBe(true);
    const archived = await service.getAccount(account.id);
    expect(archived?.archived).toBe(true);
  });

  it("gets account balance", async () => {
    const account = await service.createAccount({ name: "Bank", type: "bank" });
    expect(await service.getAccountBalance(account.id)).toBe(0);
  });

  it("prevents deleting an account with existing transactions", async () => {
    const account = await service.createAccount({ name: "Bank", type: "bank" });
    transactionRepo.mockTransactions.set("tx-1", {
      id: "tx-1",
      accountId: account.id,
      categoryId: "cat-1",
      amountMinor: 500,
    });
    await expect(service.deleteAccount(account.id)).rejects.toThrow(
      "Cannot delete account with existing transactions. Archive the account instead.",
    );
  });
});
