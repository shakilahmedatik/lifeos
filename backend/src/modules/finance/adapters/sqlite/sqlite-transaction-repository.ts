import type { Client } from "@libsql/client";

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
  constructor(private readonly client: Client) {}

  async getById(id: string): Promise<Transaction | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM transactions WHERE id = ?",
      args: [id],
    });
    const row = res.rows[0] as unknown as TransactionRow | undefined;
    return row ? rowToTransaction(row) : undefined;
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date ASC",
      args: [startDate, endDate],
    });
    const rows = res.rows as unknown as TransactionRow[];
    return rows.map(rowToTransaction);
  }

  async getByAccountId(accountId: string): Promise<Transaction[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM transactions WHERE account_id = ? ORDER BY date ASC",
      args: [accountId],
    });
    const rows = res.rows as unknown as TransactionRow[];
    return rows.map(rowToTransaction);
  }

  async getByAccountAndDateRange(
    accountId: string,
    startDate: string,
    endDate: string,
  ): Promise<Transaction[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM transactions WHERE account_id = ? AND date >= ? AND date <= ? ORDER BY date ASC",
      args: [accountId, startDate, endDate],
    });
    const rows = res.rows as unknown as TransactionRow[];
    return rows.map(rowToTransaction);
  }

  async getByCategoryId(categoryId: string): Promise<Transaction[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM transactions WHERE category_id = ? ORDER BY date ASC",
      args: [categoryId],
    });
    const rows = res.rows as unknown as TransactionRow[];
    return rows.map(rowToTransaction);
  }

  async create(id: string, input: NewTransactionInput): Promise<Transaction> {
    const now = new Date().toISOString();
    await this.client.execute({
      sql: `INSERT INTO transactions (id, account_id, category_id, date, amount_minor, currency, note, transfer_pair_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
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
      ],
    });

    return (await this.getById(id)) as Transaction;
  }

  async update(id: string, patch: Partial<NewTransactionInput>): Promise<Transaction | undefined> {
    const existing = await this.getById(id);
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

    await this.client.execute({
      sql: `UPDATE transactions SET ${fields.join(", ")} WHERE id = ?`,
      args: values,
    });

    return await this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const tx = await this.getById(id);
    if (!tx) return false;

    if (tx.transferPairId) {
      const res = await this.client.execute({
        sql: "DELETE FROM transactions WHERE id = ? OR transfer_pair_id = ?",
        args: [id, tx.transferPairId],
      });
      return res.rowsAffected > 0;
    }

    const res = await this.client.execute({
      sql: "DELETE FROM transactions WHERE id = ?",
      args: [id],
    });
    return res.rowsAffected > 0;
  }

  private getMonthDateRange(yearMonth: string): { startDate: string; endDate: string } {
    const valid = /^\d{4}-\d{2}$/.test(yearMonth);
    const targetYm = valid ? yearMonth : new Date().toISOString().slice(0, 7);
    const [yearStr, monthStr] = targetYm.split("-");
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10);
    const lastDay = new Date(year, month, 0).getDate();
    return {
      startDate: `${targetYm}-01`,
      endDate: `${targetYm}-${String(lastDay).padStart(2, "0")}`,
    };
  }

  async getMonthlyTotals(
    yearMonth: string,
  ): Promise<{ totalIncome: number; totalExpense: number }> {
    const { startDate, endDate } = this.getMonthDateRange(yearMonth);

    const incomeRes = await this.client.execute({
      sql: `SELECT COALESCE(SUM(amount_minor), 0) as total
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.date >= ? AND t.date <= ? AND c.kind = 'income' AND t.transfer_pair_id IS NULL`,
      args: [startDate, endDate],
    });

    const expenseRes = await this.client.execute({
      sql: `SELECT COALESCE(SUM(amount_minor), 0) as total
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.date >= ? AND t.date <= ? AND c.kind = 'expense' AND t.transfer_pair_id IS NULL`,
      args: [startDate, endDate],
    });

    const totalIncome = Number(incomeRes.rows[0]?.total ?? 0);
    const totalExpense = Number(expenseRes.rows[0]?.total ?? 0);

    return {
      totalIncome,
      totalExpense,
    };
  }

  async getCategoryBreakdown(yearMonth: string): Promise<{ categoryId: string; total: number }[]> {
    const { startDate, endDate } = this.getMonthDateRange(yearMonth);

    const res = await this.client.execute({
      sql: `SELECT category_id as categoryId, SUM(amount_minor) as total
            FROM transactions
            WHERE date >= ? AND date <= ? AND transfer_pair_id IS NULL
            GROUP BY category_id
            ORDER BY total DESC`,
      args: [startDate, endDate],
    });

    return res.rows.map((row) => ({
      categoryId: String(row.categoryId),
      total: Number(row.total),
    }));
  }

  async getAccountBalance(accountId: string): Promise<number> {
    const res = await this.client.execute({
      sql: `SELECT COALESCE(SUM(
               CASE
                 WHEN c.kind = 'income' THEN amount_minor
                 WHEN c.kind = 'expense' THEN -amount_minor
                 ELSE 0
               END
             ), 0) as balance
             FROM transactions t
             JOIN categories c ON t.category_id = c.id
             WHERE t.account_id = ?`,
      args: [accountId],
    });

    return Number(res.rows[0]?.balance ?? 0);
  }
}
