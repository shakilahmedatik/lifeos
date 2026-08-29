import { SYSTEM_CATEGORY_TRANSFER_IN_ID, SYSTEM_CATEGORY_TRANSFER_OUT_ID } from "@lifeos/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory tables
interface AccountRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  archived: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  _sync_status: string;
}

interface CategoryRow {
  id: string;
  name: string;
  kind: string;
  is_system: number;
  archived: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  _sync_status: string;
}

interface TransactionRow {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  date: string;
  amount_minor: number;
  currency: string;
  note: string | null;
  transfer_pair_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  _sync_status: string;
}

let accountsTable: AccountRow[] = [];
let categoriesTable: CategoryRow[] = [];
let transactionsTable: TransactionRow[] = [];

const mockDb = {
  select: vi.fn(async (sql: string, args: unknown[] = []) => {
    // Accounts
    if (sql.includes("FROM accounts")) {
      if (sql.includes("WHERE id = ? AND deleted_at IS NULL")) {
        const id = args[0] as string;
        return accountsTable.filter((a) => a.id === id && !a.deleted_at);
      }
      if (sql.includes("WHERE deleted_at IS NULL AND archived = 0")) {
        return accountsTable.filter((a) => !a.deleted_at && a.archived === 0);
      }
      if (sql.includes("WHERE deleted_at IS NULL")) {
        return accountsTable.filter((a) => !a.deleted_at);
      }
      return accountsTable;
    }

    // Categories
    if (sql.includes("FROM categories")) {
      if (
        sql.includes(
          "SELECT id, is_system FROM categories WHERE (id = ? OR lower(name) = lower(?))",
        )
      ) {
        const [id, name] = args as [string, string];
        return categoriesTable.filter(
          (c) => !c.deleted_at && (c.id === id || c.name.toLowerCase() === name.toLowerCase()),
        );
      }
      if (sql.includes("lower(name) = 'transfer out'")) {
        const [id] = args as [string];
        return categoriesTable.filter(
          (c) =>
            !c.deleted_at &&
            (c.id === id || c.name.toLowerCase() === "transfer out") &&
            c.kind === "expense",
        );
      }
      if (sql.includes("lower(name) = 'transfer in'")) {
        const [id] = args as [string];
        return categoriesTable.filter(
          (c) =>
            !c.deleted_at &&
            (c.id === id || c.name.toLowerCase() === "transfer in") &&
            c.kind === "income",
        );
      }
      if (sql.includes("WHERE id = ? AND deleted_at IS NULL")) {
        const id = args[0] as string;
        return categoriesTable.filter((c) => c.id === id && !c.deleted_at);
      }
      if (sql.includes("kind = 'expense'") && sql.includes("archived = 0")) {
        return categoriesTable.filter(
          (c) => !c.deleted_at && c.kind === "expense" && c.archived === 0,
        );
      }
      if (sql.includes("kind = 'income'") && sql.includes("archived = 0")) {
        return categoriesTable.filter(
          (c) => !c.deleted_at && c.kind === "income" && c.archived === 0,
        );
      }
      if (sql.includes("WHERE deleted_at IS NULL AND archived = 0")) {
        return categoriesTable.filter((c) => !c.deleted_at && c.archived === 0);
      }
      if (sql.includes("WHERE deleted_at IS NULL")) {
        return categoriesTable.filter((c) => !c.deleted_at);
      }
      return categoriesTable;
    }

    // Account Balance
    if (
      sql.includes("balance") &&
      sql.includes("WHERE t.account_id = ? AND t.deleted_at IS NULL")
    ) {
      const accountId = args[0] as string;
      const txs = transactionsTable.filter((t) => t.account_id === accountId && !t.deleted_at);
      const catMap = new Map(categoriesTable.map((c) => [c.id, c]));
      let balance = 0;
      for (const t of txs) {
        const cat = catMap.get(t.category_id);
        if (cat?.kind === "income") balance += t.amount_minor;
        else if (cat?.kind === "expense") balance -= t.amount_minor;
      }
      return [{ balance }];
    }

    // Monthly totals: Income
    if (sql.includes("c.kind = 'income'") && sql.includes("t.transfer_pair_id IS NULL")) {
      const startDate = args[0] as string;
      const endDate = args[1] as string;
      const catMap = new Map(categoriesTable.map((c) => [c.id, c]));
      const txs = transactionsTable.filter(
        (t) =>
          !t.deleted_at &&
          !t.transfer_pair_id &&
          t.date >= startDate &&
          t.date <= endDate &&
          catMap.get(t.category_id)?.kind === "income",
      );
      const total = txs.reduce((sum, t) => sum + t.amount_minor, 0);
      return [{ total }];
    }

    // Monthly totals: Expense
    if (sql.includes("c.kind = 'expense'") && sql.includes("t.transfer_pair_id IS NULL")) {
      const startDate = args[0] as string;
      const endDate = args[1] as string;
      const catMap = new Map(categoriesTable.map((c) => [c.id, c]));
      const txs = transactionsTable.filter(
        (t) =>
          !t.deleted_at &&
          !t.transfer_pair_id &&
          t.date >= startDate &&
          t.date <= endDate &&
          catMap.get(t.category_id)?.kind === "expense",
      );
      const total = txs.reduce((sum, t) => sum + t.amount_minor, 0);
      return [{ total }];
    }

    // Category breakdown
    if (sql.includes("GROUP BY c.id")) {
      const startDate = args[0] as string;
      const endDate = args[1] as string;
      const catMap = new Map(categoriesTable.map((c) => [c.id, c]));
      const groups = new Map<
        string,
        { categoryId: string; categoryName: string; kind: string; total: number }
      >();

      for (const t of transactionsTable) {
        if (t.deleted_at || t.transfer_pair_id || t.date < startDate || t.date > endDate) continue;
        const cat = catMap.get(t.category_id);
        if (!cat) continue;
        const existing = groups.get(cat.id) || {
          categoryId: cat.id,
          categoryName: cat.name,
          kind: cat.kind,
          total: 0,
        };
        existing.total += t.amount_minor;
        groups.set(cat.id, existing);
      }
      return Array.from(groups.values()).sort((a, b) => b.total - a.total);
    }

    // Transactions
    if (sql.includes("FROM transactions")) {
      if (sql.includes("WHERE id = ? AND deleted_at IS NULL")) {
        const id = args[0] as string;
        return transactionsTable.filter((t) => t.id === id && !t.deleted_at);
      }
      if (sql.includes("SELECT transfer_pair_id FROM transactions WHERE id = ?")) {
        const id = args[0] as string;
        const found = transactionsTable.find((t) => t.id === id);
        return found ? [{ transfer_pair_id: found.transfer_pair_id }] : [];
      }
      if (sql.includes("WHERE deleted_at IS NULL AND date >= ? AND date <= ?")) {
        const startDate = args[0] as string;
        const endDate = args[1] as string;
        return transactionsTable.filter(
          (t) => !t.deleted_at && t.date >= startDate && t.date <= endDate,
        );
      }
      if (sql.includes("WHERE deleted_at IS NULL AND account_id = ?")) {
        const accountId = args[0] as string;
        return transactionsTable.filter((t) => !t.deleted_at && t.account_id === accountId);
      }
      if (sql.includes("WHERE deleted_at IS NULL")) {
        return transactionsTable.filter((t) => !t.deleted_at);
      }
      return transactionsTable;
    }

    return [];
  }),

  execute: vi.fn(async (sql: string, args: unknown[] = []) => {
    // INSERT INTO accounts
    if (sql.includes("INSERT INTO accounts")) {
      const [id, name, type, createdAt, updatedAt] = args as [
        string,
        string,
        string,
        string,
        string,
      ];
      accountsTable.push({
        id,
        user_id: "",
        name,
        type,
        archived: 0,
        created_at: createdAt,
        updated_at: updatedAt,
        deleted_at: null,
        _sync_status: "pending",
      });
      return { rowsAffected: 1 };
    }

    // UPDATE accounts
    if (sql.includes("UPDATE accounts")) {
      if (sql.includes("SET name = ?, type = ?, updated_at = ?")) {
        const [name, type, updatedAt, id] = args as [string, string, string, string];
        const acc = accountsTable.find((a) => a.id === id);
        if (acc) {
          acc.name = name;
          acc.type = type;
          acc.updated_at = updatedAt;
          acc._sync_status = "pending";
        }
      } else if (sql.includes("SET archived = 1")) {
        const [updatedAt, id] = args as [string, string];
        const acc = accountsTable.find((a) => a.id === id);
        if (acc) {
          acc.archived = 1;
          acc.updated_at = updatedAt;
          acc._sync_status = "pending";
        }
      } else if (sql.includes("SET archived = 0")) {
        const [updatedAt, id] = args as [string, string];
        const acc = accountsTable.find((a) => a.id === id);
        if (acc) {
          acc.archived = 0;
          acc.updated_at = updatedAt;
          acc._sync_status = "pending";
        }
      } else if (sql.includes("SET deleted_at = ?")) {
        const [deletedAt, updatedAt, id] = args as [string, string, string];
        const acc = accountsTable.find((a) => a.id === id);
        if (acc) {
          acc.deleted_at = deletedAt;
          acc.updated_at = updatedAt;
          acc._sync_status = "pending";
        }
      }
      return { rowsAffected: 1 };
    }

    // INSERT INTO categories
    if (sql.includes("INSERT OR IGNORE INTO categories")) {
      const [id, name, kind, createdAt, updatedAt] = args as [
        string,
        string,
        string,
        string,
        string,
      ];
      categoriesTable.push({
        id,
        name,
        kind,
        is_system: 1,
        archived: 0,
        created_at: createdAt,
        updated_at: updatedAt,
        deleted_at: null,
        _sync_status: "pending",
      });
      return { rowsAffected: 1 };
    }

    if (sql.includes("INSERT INTO categories")) {
      if (args.length >= 6) {
        const [id, name, kind, isSystem, createdAt, updatedAt] = args as [
          string,
          string,
          string,
          number,
          string,
          string,
        ];
        categoriesTable.push({
          id,
          name,
          kind,
          is_system: Number(isSystem) || 0,
          archived: 0,
          created_at: createdAt,
          updated_at: updatedAt,
          deleted_at: null,
          _sync_status: "pending",
        });
      } else {
        const [id, name, kind, createdAt, updatedAt] = args as [
          string,
          string,
          string,
          string,
          string,
        ];
        categoriesTable.push({
          id,
          name,
          kind,
          is_system: 0,
          archived: 0,
          created_at: createdAt,
          updated_at: updatedAt,
          deleted_at: null,
          _sync_status: "pending",
        });
      }
      return { rowsAffected: 1 };
    }

    // UPDATE categories
    if (sql.includes("UPDATE categories")) {
      if (sql.includes("SET is_system = 1")) {
        const [updatedAt, id] = args as [string, string];
        const cat = categoriesTable.find((c) => c.id === id);
        if (cat) {
          cat.is_system = 1;
          cat.updated_at = updatedAt;
        }
      } else if (sql.includes("SET name = ?, kind = ?, updated_at = ?")) {
        const [name, kind, updatedAt, id] = args as [string, string, string, string];
        const cat = categoriesTable.find((c) => c.id === id);
        if (cat) {
          cat.name = name;
          cat.kind = kind;
          cat.updated_at = updatedAt;
          cat._sync_status = "pending";
        }
      } else if (sql.includes("SET archived = 1")) {
        const [updatedAt, id] = args as [string, string];
        const cat = categoriesTable.find((c) => c.id === id);
        if (cat) {
          cat.archived = 1;
          cat.updated_at = updatedAt;
          cat._sync_status = "pending";
        }
      } else if (sql.includes("SET archived = 0")) {
        const [updatedAt, id] = args as [string, string];
        const cat = categoriesTable.find((c) => c.id === id);
        if (cat) {
          cat.archived = 0;
          cat.updated_at = updatedAt;
          cat._sync_status = "pending";
        }
      } else if (sql.includes("SET deleted_at = ?")) {
        const [deletedAt, updatedAt, id] = args as [string, string, string];
        const cat = categoriesTable.find((c) => c.id === id);
        if (cat) {
          cat.deleted_at = deletedAt;
          cat.updated_at = updatedAt;
          cat._sync_status = "pending";
        }
      }
      return { rowsAffected: 1 };
    }

    // INSERT INTO transactions
    if (sql.includes("INSERT INTO transactions")) {
      const [
        id,
        accountId,
        categoryId,
        date,
        amountMinor,
        currency,
        note,
        transferPairId,
        createdAt,
        updatedAt,
      ] = args as [
        string,
        string,
        string,
        string,
        number,
        string,
        string | null,
        string | null,
        string,
        string,
      ];
      transactionsTable.push({
        id,
        user_id: "",
        account_id: accountId,
        category_id: categoryId,
        date,
        amount_minor: amountMinor,
        currency,
        note,
        transfer_pair_id: transferPairId,
        created_at: createdAt,
        updated_at: updatedAt,
        deleted_at: null,
        _sync_status: "pending",
      });
      return { rowsAffected: 1 };
    }

    // UPDATE transactions
    if (sql.includes("UPDATE transactions")) {
      if (sql.includes("SET deleted_at = ?") && sql.includes("transfer_pair_id = ?")) {
        const [deletedAt, updatedAt, id, transferPairId] = args as [string, string, string, string];
        for (const t of transactionsTable) {
          if (t.id === id || (transferPairId && t.transfer_pair_id === transferPairId)) {
            t.deleted_at = deletedAt;
            t.updated_at = updatedAt;
            t._sync_status = "pending";
          }
        }
      } else if (sql.includes("SET deleted_at = ?")) {
        const [deletedAt, updatedAt, id] = args as [string, string, string];
        const tx = transactionsTable.find((t) => t.id === id);
        if (tx) {
          tx.deleted_at = deletedAt;
          tx.updated_at = updatedAt;
          tx._sync_status = "pending";
        }
      } else if (sql.includes("SET account_id = ?")) {
        const [
          accountId,
          categoryId,
          date,
          amountMinor,
          currency,
          note,
          transferPairId,
          updatedAt,
          id,
        ] = args as [
          string,
          string,
          string,
          number,
          string,
          string | null,
          string | null,
          string,
          string,
        ];
        const tx = transactionsTable.find((t) => t.id === id);
        if (tx) {
          tx.account_id = accountId;
          tx.category_id = categoryId;
          tx.date = date;
          tx.amount_minor = amountMinor;
          tx.currency = currency;
          tx.note = note;
          tx.transfer_pair_id = transferPairId;
          tx.updated_at = updatedAt;
          tx._sync_status = "pending";
        }
      }
      return { rowsAffected: 1 };
    }

    return { rowsAffected: 0 };
  }),
};

vi.mock("../index.js", () => ({
  getLocalDb: vi.fn(async () => mockDb),
}));

import { localDal } from "../dal.js";

describe("localDal Finance operations", () => {
  beforeEach(() => {
    accountsTable = [];
    categoriesTable = [];
    transactionsTable = [];
    vi.clearAllMocks();
  });

  describe("Accounts CRUD", () => {
    it("should create, list, update, archive, unarchive, and delete accounts", async () => {
      const created = await localDal.createAccount({ name: "Primary Checking", type: "bank" });
      expect(created.id).toBeDefined();
      expect(created.name).toBe("Primary Checking");
      expect(created.type).toBe("bank");
      expect(created.archived).toBe(false);

      const accounts = await localDal.getAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].balance).toBe(0);

      const activeAccounts = await localDal.getActiveAccounts();
      expect(activeAccounts).toHaveLength(1);

      const single = await localDal.getAccount(created.id);
      expect(single?.name).toBe("Primary Checking");

      const updated = await localDal.updateAccount(created.id, {
        name: "City Checking",
        type: "bank",
      });
      expect(updated.name).toBe("City Checking");

      await localDal.archiveAccount(created.id);
      expect(await localDal.getActiveAccounts()).toHaveLength(0);

      await localDal.unarchiveAccount(created.id);
      expect(await localDal.getActiveAccounts()).toHaveLength(1);

      await localDal.deleteAccount(created.id);
      expect(await localDal.getAccounts()).toHaveLength(0);
    });
  });

  describe("Categories CRUD", () => {
    it("should create, list, filter by kind, update, archive, and delete categories", async () => {
      const salary = await localDal.createCategory({ name: "Salary", kind: "income" });
      const food = await localDal.createCategory({ name: "Food & Dining", kind: "expense" });

      expect(salary.id).toBeDefined();
      expect(salary.isSystem).toBe(false);
      expect(food.id).toBeDefined();
      expect(food.isSystem).toBe(false);

      // 2 system defaults (Transfer In, Transfer Out) + 2 user categories = 4
      const all = await localDal.getCategories();
      expect(all).toHaveLength(4);

      // Transfer In + Salary = 2
      const incomeCats = await localDal.getIncomeCategories();
      expect(incomeCats).toHaveLength(2);
      expect(incomeCats.some((c) => c.name === "Salary")).toBe(true);

      // Transfer Out + Food & Dining = 2
      const expenseCats = await localDal.getExpenseCategories();
      expect(expenseCats).toHaveLength(2);
      expect(expenseCats.some((c) => c.name === "Food & Dining")).toBe(true);

      const updated = await localDal.updateCategory(food.id, {
        name: "Groceries & Food",
        kind: "expense",
      });
      expect(updated.name).toBe("Groceries & Food");

      await localDal.archiveCategory(salary.id);
      expect(await localDal.getActiveCategories()).toHaveLength(3);

      await localDal.deleteCategory(food.id);
      expect(await localDal.getCategories()).toHaveLength(3);
    });

    it("should prevent creating reserved categories and modifying/deleting system categories", async () => {
      await expect(
        localDal.createCategory({ name: "Transfer In", kind: "income" }),
      ).rejects.toThrow("reserved system categories");

      await expect(
        localDal.createCategory({ name: "Transfer Out", kind: "expense" }),
      ).rejects.toThrow("reserved system categories");

      const all = await localDal.getCategories();
      const systemCat = all.find((c) => c.isSystem);
      expect(systemCat).toBeDefined();

      await expect(
        localDal.updateCategory(systemCat!.id, { name: "Custom Transfer" }),
      ).rejects.toThrow("Cannot modify system category");

      await expect(localDal.archiveCategory(systemCat!.id)).rejects.toThrow(
        "Cannot archive system category",
      );

      await expect(localDal.deleteCategory(systemCat!.id)).rejects.toThrow(
        "Cannot delete system category",
      );
    });
  });

  describe("Transactions and Account Balances", () => {
    it("should calculate correct balance for income and expense transactions", async () => {
      const bank = await localDal.createAccount({ name: "Bank", type: "bank" });
      const salary = await localDal.createCategory({ name: "Salary", kind: "income" });
      const dining = await localDal.createCategory({ name: "Dining", kind: "expense" });

      // Income +50000 BDT minor units
      await localDal.createTransaction({
        accountId: bank.id,
        categoryId: salary.id,
        date: "2026-08-01",
        amountMinor: 50000,
      });

      // Expense -15000 BDT minor units
      const expenseTx = await localDal.createTransaction({
        accountId: bank.id,
        categoryId: dining.id,
        date: "2026-08-05",
        amountMinor: 15000,
      });

      let balance = await localDal.getAccountBalance(bank.id);
      expect(balance).toBe(35000);

      const accountsWithBalance = await localDal.getAccounts();
      expect(accountsWithBalance[0].balance).toBe(35000);

      // Edit expense to 20000
      await localDal.updateTransaction(expenseTx.id, { amountMinor: 20000 });
      balance = await localDal.getAccountBalance(bank.id);
      expect(balance).toBe(30000);

      // Delete expense
      await localDal.deleteTransaction(expenseTx.id);
      balance = await localDal.getAccountBalance(bank.id);
      expect(balance).toBe(50000);
    });

    it("should handle transfers between two accounts properly with dedicated categories", async () => {
      const bank = await localDal.createAccount({ name: "Bank", type: "bank" });
      const cash = await localDal.createAccount({ name: "Cash", type: "cash" });

      const transferResult = await localDal.createTransfer(
        bank.id,
        cash.id,
        10000,
        "2026-08-10",
        "ATM Withdrawal",
      );

      expect(transferResult.from.accountId).toBe(bank.id);
      expect(transferResult.to.accountId).toBe(cash.id);
      expect(transferResult.from.categoryId).toBe(SYSTEM_CATEGORY_TRANSFER_OUT_ID);
      expect(transferResult.to.categoryId).toBe(SYSTEM_CATEGORY_TRANSFER_IN_ID);
      expect(transferResult.from.transferPairId).toBe(transferResult.to.transferPairId);

      const bankBalance = await localDal.getAccountBalance(bank.id);
      const cashBalance = await localDal.getAccountBalance(cash.id);

      expect(bankBalance).toBe(-10000);
      expect(cashBalance).toBe(10000);

      // Deleting one side of transfer should soft delete both transactions
      await localDal.deleteTransaction(transferResult.from.id);
      expect(await localDal.getAccountBalance(bank.id)).toBe(0);
      expect(await localDal.getAccountBalance(cash.id)).toBe(0);
    });
  });

  describe("Reports and Widgets", () => {
    it("should compute monthly summary, category breakdown, and widget data without counting transfers as expenses", async () => {
      const bank = await localDal.createAccount({ name: "Bank", type: "bank" });
      const cash = await localDal.createAccount({ name: "Cash", type: "cash" });
      const salary = await localDal.createCategory({ name: "Salary", kind: "income" });
      const rent = await localDal.createCategory({ name: "Rent", kind: "expense" });
      const utilities = await localDal.createCategory({ name: "Utilities", kind: "expense" });

      // Income 100,000 in Aug 2026
      await localDal.createTransaction({
        accountId: bank.id,
        categoryId: salary.id,
        date: "2026-08-01",
        amountMinor: 100000,
      });

      // Expense 30,000 rent in Aug 2026
      await localDal.createTransaction({
        accountId: bank.id,
        categoryId: rent.id,
        date: "2026-08-02",
        amountMinor: 30000,
      });

      // Expense 5,000 utilities in Aug 2026
      await localDal.createTransaction({
        accountId: bank.id,
        categoryId: utilities.id,
        date: "2026-08-03",
        amountMinor: 5000,
      });

      // Transfer 10,000 (should not affect income / expense total in summary)
      await localDal.createTransfer(bank.id, cash.id, 10000, "2026-08-04");

      const summary = await localDal.getMonthlySummary("2026-08");
      expect(summary.totalIncome).toBe(100000);
      expect(summary.totalExpense).toBe(35000);
      expect(summary.net).toBe(65000);

      const breakdown = await localDal.getCategoryBreakdown("2026-08");
      expect(breakdown).toHaveLength(3);
      expect(breakdown[0].total).toBe(100000); // Salary
      expect(breakdown[1].total).toBe(30000); // Rent
      expect(breakdown[2].total).toBe(5000); // Utilities

      const widget = await localDal.getFinanceWidget();
      expect(widget.summary).toBeDefined();
      expect(widget.topExpenses).toBeDefined();
    });
  });
});
