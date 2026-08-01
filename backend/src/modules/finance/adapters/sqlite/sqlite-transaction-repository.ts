import type Database from "better-sqlite3";

import type { NewTransactionInput, Transaction } from "../../domain/types.js";
import type { TransactionRepository } from "../../ports/transaction-repository.js";

interface TransactionRow {
  id: string;
  account_id: string;
  category_id: string;
  date: string;
  amount_minor: number;
  currency: string;
  note: string | null;
  transfer_pair_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    accountId: row.account_id,
    categoryId: row.category_id,
    date: row.date,
    amountMinor: row.amount_minor,
    currency: row.currency,
    note: row.note ?? undefined,
    transferPairId: row.transfer_pair_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteTransactionRepository implements TransactionRepository {
  constructor(private readonly db: Database.Database) {}

  getById(id: string): Transaction | undefined {
    const row = this.db.prepare("SELECT * FROM transactions WHERE id = ?").get(id) as
      | TransactionRow
      | undefined;
    return row ? rowToTransaction(row) : undefined;
  }

  getByDateRange(startDate: string, endDate: string): Transaction[] {
    const rows = this.db
      .prepare("SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date ASC")
      .all(startDate, endDate) as TransactionRow[];
    return rows.map(rowToTransaction);
  }

  getByAccountId(accountId: string): Transaction[] {
    const rows = this.db
      .prepare("SELECT * FROM transactions WHERE account_id = ? ORDER BY date ASC")
      .all(accountId) as TransactionRow[];
    return rows.map(rowToTransaction);
  }

  create(id: string, input: NewTransactionInput): Transaction {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO transactions (id, account_id, category_id, date, amount_minor, currency, note, transfer_pair_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.accountId,
        input.categoryId,
        input.date,
        input.amountMinor,
        input.currency ?? "BDT",
        input.note ?? null,
        input.transferPairId ?? null,
        now,
        now,
      );

    return this.getById(id) as Transaction;
  }

  update(id: string, patch: Partial<NewTransactionInput>): Transaction | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (patch.accountId !== undefined) {
      fields.push("account_id = ?");
      values.push(patch.accountId);
    }
    if (patch.categoryId !== undefined) {
      fields.push("category_id = ?");
      values.push(patch.categoryId);
    }
    if (patch.date !== undefined) {
      fields.push("date = ?");
      values.push(patch.date);
    }
    if (patch.amountMinor !== undefined) {
      fields.push("amount_minor = ?");
      values.push(patch.amountMinor);
    }
    if (patch.currency !== undefined) {
      fields.push("currency = ?");
      values.push(patch.currency);
    }
    if (patch.note !== undefined) {
      fields.push("note = ?");
      values.push(patch.note ?? null);
    }
    if (patch.transferPairId !== undefined) {
      fields.push("transfer_pair_id = ?");
      values.push(patch.transferPairId ?? null);
    }

    if (fields.length === 0) return existing;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    this.db.prepare(`UPDATE transactions SET ${fields.join(", ")} WHERE id = ?`).run(...values);

    return this.getById(id);
  }

  delete(id: string): boolean {
    const tx = this.getById(id);
    if (!tx) return false;

    if (tx.transferPairId) {
      const result = this.db
        .prepare("DELETE FROM transactions WHERE id = ? OR transfer_pair_id = ?")
        .run(id, tx.transferPairId);
      return result.changes > 0;
    }

    const result = this.db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
    return result.changes > 0;
  }

  private getMonthDateRange(yearMonth: string): { startDate: string; endDate: string } {
    const [yearStr, monthStr] = yearMonth.split("-");
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10);
    const lastDay = new Date(year, month, 0).getDate();
    return {
      startDate: `${yearMonth}-01`,
      endDate: `${yearMonth}-${String(lastDay).padStart(2, "0")}`,
    };
  }

  getMonthlyTotals(yearMonth: string): { totalIncome: number; totalExpense: number } {
    const { startDate, endDate } = this.getMonthDateRange(yearMonth);

    const incomeResult = this.db
      .prepare(
        `SELECT COALESCE(SUM(amount_minor), 0) as total
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.date >= ? AND t.date <= ? AND c.kind = 'income' AND t.transfer_pair_id IS NULL`,
      )
      .get(startDate, endDate) as { total: number };

    const expenseResult = this.db
      .prepare(
        `SELECT COALESCE(SUM(amount_minor), 0) as total
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.date >= ? AND t.date <= ? AND c.kind = 'expense' AND t.transfer_pair_id IS NULL`,
      )
      .get(startDate, endDate) as { total: number };

    return {
      totalIncome: incomeResult.total,
      totalExpense: expenseResult.total,
    };
  }

  getCategoryBreakdown(yearMonth: string): { categoryId: string; total: number }[] {
    const { startDate, endDate } = this.getMonthDateRange(yearMonth);

    return this.db
      .prepare(
        `SELECT category_id as categoryId, SUM(amount_minor) as total
         FROM transactions
         WHERE date >= ? AND date <= ? AND transfer_pair_id IS NULL
         GROUP BY category_id
         ORDER BY total DESC`,
      )
      .all(startDate, endDate) as { categoryId: string; total: number }[];
  }

  getAccountBalance(accountId: string): number {
    const result = this.db
      .prepare(
        `SELECT COALESCE(SUM(
           CASE
             WHEN c.kind = 'income' THEN amount_minor
             WHEN c.kind = 'expense' THEN -amount_minor
             ELSE 0
           END
         ), 0) as balance
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.account_id = ?`,
      )
      .get(accountId) as { balance: number };

    return result.balance;
  }
}
