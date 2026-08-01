import { beforeEach, describe, expect, it } from "vitest";

import { AccountService } from "../application/account-service.js";
import type { Account, NewAccountInput } from "../domain/types.js";
import type { AccountRepository } from "../ports/account-repository.js";
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
    create(id: string, input: NewAccountInput) {
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
    update(id: string, patch: Partial<NewAccountInput>) {
      const existing = accounts.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      accounts.set(id, updated);
      return updated;
    },
    archive(id: string) {
      const account = accounts.get(id);
      if (!account) return false;
      account.archived = true;
      account.updatedAt = new Date().toISOString();
      return true;
    },
    unarchive(id: string) {
      const account = accounts.get(id);
      if (!account) return false;
      account.archived = false;
      account.updatedAt = new Date().toISOString();
      return true;
    },
    delete(id: string) {
      return accounts.delete(id);
    },
  };
}

function createMockTransactionRepo(): TransactionRepository {
  return {
    getById: () => undefined,
    getByDateRange: () => [],
    getByAccountId: () => [],
    create: (id, input) => ({
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
    }),
    update: () => undefined,
    delete: () => false,
    getMonthlyTotals: () => ({ totalIncome: 0, totalExpense: 0 }),
    getCategoryBreakdown: () => [],
    getAccountBalance: () => 0,
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

  it("creates an account", () => {
    const account = service.createAccount({ name: "Main Bank", type: "bank" });
    expect(account.name).toBe("Main Bank");
    expect(account.type).toBe("bank");
    expect(account.archived).toBe(false);
    expect(accountRepo.accounts.size).toBe(1);
  });

  it("lists all accounts", () => {
    service.createAccount({ name: "Account 1", type: "bank" });
    service.createAccount({ name: "Account 2", type: "cash" });
    expect(service.listAccounts()).toHaveLength(2);
  });

  it("lists only active accounts", () => {
    const account1 = service.createAccount({ name: "Active", type: "bank" });
    service.createAccount({ name: "To Archive", type: "cash" });
    service.archiveAccount(account1.id);
    expect(service.listActiveAccounts()).toHaveLength(1);
    expect(service.listActiveAccounts()[0].name).toBe("To Archive");
  });

  it("updates an account", () => {
    const account = service.createAccount({ name: "Old Name", type: "bank" });
    const updated = service.updateAccount(account.id, { name: "New Name" });
    expect(updated?.name).toBe("New Name");
  });

  it("archives an account", () => {
    const account = service.createAccount({ name: "To Archive", type: "bank" });
    expect(service.archiveAccount(account.id)).toBe(true);
    const archived = service.getAccount(account.id);
    expect(archived?.archived).toBe(true);
  });

  it("gets account balance", () => {
    const account = service.createAccount({ name: "Bank", type: "bank" });
    expect(service.getAccountBalance(account.id)).toBe(0);
  });
});
