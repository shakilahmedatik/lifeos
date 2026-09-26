import {
  SYSTEM_CATEGORY_OPENING_BALANCE_EXPENSE_ID,
  SYSTEM_CATEGORY_OPENING_BALANCE_ID,
} from "@lifeos/contracts";
import { and, asc, desc, eq, gte, isNull, lte, notInArray, or, sql } from "drizzle-orm";

import type { DrizzleClient } from "../../../../shared/db.js";
import { categories, transactions } from "../../../../shared/schema.js";
import type { NewTransactionInput, Transaction } from "../../domain/types.js";
import type { TransactionRepository } from "../../ports/transaction-repository.js";

function rowToTransaction(row: typeof transactions.$inferSelect): Transaction {
  return {
    id: row.id,
    accountId: row.accountId,
    categoryId: row.categoryId,
    date: row.date,
    amountMinor: row.amountMinor,
    currency: row.currency,
    note: row.note ?? undefined,
    transferPairId: row.transferPairId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function userScope(userId: string) {
  return and(
    userId ? eq(transactions.userId, userId) : eq(transactions.userId, ""),
    isNull(transactions.deletedAt),
  );
}

export class DrizzleTransactionRepository implements TransactionRepository {
  constructor(private readonly db: DrizzleClient) {}

  async getById(id: string, userId: string): Promise<Transaction | undefined> {
    const [row] = await this.db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), userScope(userId)));
    return row ? rowToTransaction(row) : undefined;
  }

  async getByDateRange(startDate: string, endDate: string, userId: string): Promise<Transaction[]> {
    const rows = await this.db
      .select()
      .from(transactions)
      .where(
        and(
          userScope(userId),
          sql`substr(${transactions.date}, 1, 10) >= ${startDate}`,
          sql`substr(${transactions.date}, 1, 10) <= ${endDate}`,
        ),
      )
      .orderBy(asc(transactions.date));
    return rows.map(rowToTransaction);
  }

  async getByAccountId(accountId: string, userId: string): Promise<Transaction[]> {
    const rows = await this.db
      .select()
      .from(transactions)
      .where(and(eq(transactions.accountId, accountId), userScope(userId)))
      .orderBy(asc(transactions.date));
    return rows.map(rowToTransaction);
  }

  async getByAccountAndDateRange(
    accountId: string,
    startDate: string,
    endDate: string,
    userId: string,
  ): Promise<Transaction[]> {
    const rows = await this.db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId),
          userScope(userId),
          sql`substr(${transactions.date}, 1, 10) >= ${startDate}`,
          sql`substr(${transactions.date}, 1, 10) <= ${endDate}`,
        ),
      )
      .orderBy(asc(transactions.date));
    return rows.map(rowToTransaction);
  }

  async getByCategoryId(categoryId: string, userId: string): Promise<Transaction[]> {
    const rows = await this.db
      .select()
      .from(transactions)
      .where(and(eq(transactions.categoryId, categoryId), userScope(userId)))
      .orderBy(asc(transactions.date));
    return rows.map(rowToTransaction);
  }

  async create(id: string, input: NewTransactionInput, userId: string): Promise<Transaction> {
    const now = new Date().toISOString();
    await this.db.insert(transactions).values({
      id,
      userId,
      accountId: input.accountId,
      categoryId: input.categoryId,
      date: input.date,
      amountMinor: input.amountMinor,
      currency: input.currency ?? "BDT",
      note: input.note ?? null,
      transferPairId: input.transferPairId ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return (await this.getById(id, userId)) as Transaction;
  }

  async update(
    id: string,
    patch: Partial<NewTransactionInput>,
    userId: string,
  ): Promise<Transaction | undefined> {
    const existing = await this.getById(id, userId);
    if (!existing) return undefined;

    const updates: Record<string, unknown> = {};
    if (patch.accountId !== undefined) updates.accountId = patch.accountId;
    if (patch.categoryId !== undefined) updates.categoryId = patch.categoryId;
    if (patch.date !== undefined) updates.date = patch.date;
    if (patch.amountMinor !== undefined) updates.amountMinor = patch.amountMinor;
    if (patch.currency !== undefined) updates.currency = patch.currency;
    if (patch.note !== undefined) updates.note = patch.note ?? null;
    if (patch.transferPairId !== undefined) updates.transferPairId = patch.transferPairId ?? null;

    if (Object.keys(updates).length === 0) return existing;

    updates.updatedAt = new Date().toISOString();

    await this.db
      .update(transactions)
      .set(updates)
      .where(and(eq(transactions.id, id), userScope(userId)));

    return await this.getById(id, userId);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const tx = await this.getById(id, userId);
    if (!tx) return false;

    const now = new Date().toISOString();
    if (tx.transferPairId) {
      const result = await this.db
        .update(transactions)
        .set({ deletedAt: now, updatedAt: now })
        .where(
          and(
            or(eq(transactions.id, id), eq(transactions.transferPairId, tx.transferPairId)),
            userScope(userId),
          ),
        );
      return result.rowsAffected > 0;
    }

    const result = await this.db
      .update(transactions)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(transactions.id, id), userScope(userId)));
    return result.rowsAffected > 0;
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
    userId: string,
  ): Promise<{ totalIncome: number; totalExpense: number }> {
    const { startDate, endDate } = this.getMonthDateRange(yearMonth);

    const txUserScope = userId ? eq(transactions.userId, userId) : eq(transactions.userId, "");
    const catUserScope = or(
      userId ? eq(categories.userId, userId) : eq(categories.userId, ""),
      eq(categories.isSystem, 1),
    );

    const [incomeResult] = await this.db
      .select({ total: sql<number>`COALESCE(SUM(${transactions.amountMinor}), 0)` })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          gte(transactions.date, startDate),
          lte(transactions.date, endDate),
          eq(categories.kind, "income"),
          isNull(transactions.transferPairId),
          isNull(transactions.deletedAt),
          isNull(categories.deletedAt),
          notInArray(categories.id, [
            SYSTEM_CATEGORY_OPENING_BALANCE_ID,
            SYSTEM_CATEGORY_OPENING_BALANCE_EXPENSE_ID,
          ]),
          txUserScope,
          catUserScope,
        ),
      );

    const [expenseResult] = await this.db
      .select({ total: sql<number>`COALESCE(SUM(${transactions.amountMinor}), 0)` })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          gte(transactions.date, startDate),
          lte(transactions.date, endDate),
          eq(categories.kind, "expense"),
          isNull(transactions.transferPairId),
          isNull(transactions.deletedAt),
          isNull(categories.deletedAt),
          notInArray(categories.id, [
            SYSTEM_CATEGORY_OPENING_BALANCE_ID,
            SYSTEM_CATEGORY_OPENING_BALANCE_EXPENSE_ID,
          ]),
          txUserScope,
          catUserScope,
        ),
      );

    return {
      totalIncome: Number(incomeResult?.total ?? 0),
      totalExpense: Number(expenseResult?.total ?? 0),
    };
  }

  async getCategoryBreakdown(
    yearMonth: string,
    userId: string,
  ): Promise<{ categoryId: string; total: number }[]> {
    const { startDate, endDate } = this.getMonthDateRange(yearMonth);
    const txUserScope = userId ? eq(transactions.userId, userId) : eq(transactions.userId, "");

    const rows = await this.db
      .select({
        categoryId: transactions.categoryId,
        total: sql<number>`SUM(${transactions.amountMinor})`,
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.date, startDate),
          lte(transactions.date, endDate),
          isNull(transactions.transferPairId),
          isNull(transactions.deletedAt),
          notInArray(transactions.categoryId, [
            SYSTEM_CATEGORY_OPENING_BALANCE_ID,
            SYSTEM_CATEGORY_OPENING_BALANCE_EXPENSE_ID,
          ]),
          txUserScope,
        ),
      )
      .groupBy(transactions.categoryId)
      .orderBy(desc(sql`SUM(${transactions.amountMinor})`));

    return rows.map((row) => ({
      categoryId: row.categoryId,
      total: Number(row.total),
    }));
  }

  async getAccountBalance(accountId: string, userId: string): Promise<number> {
    const txUserScope = userId ? eq(transactions.userId, userId) : eq(transactions.userId, "");
    const catUserScope = or(
      userId ? eq(categories.userId, userId) : eq(categories.userId, ""),
      eq(categories.isSystem, 1),
    );

    const [result] = await this.db
      .select({
        balance: sql<number>`COALESCE(SUM(
          CASE
            WHEN ${categories.kind} = 'income' THEN ${transactions.amountMinor}
            WHEN ${categories.kind} = 'expense' THEN -${transactions.amountMinor}
            ELSE 0
          END
        ), 0)`,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.accountId, accountId),
          isNull(transactions.deletedAt),
          isNull(categories.deletedAt),
          txUserScope,
          catUserScope,
        ),
      );

    return Number(result?.balance ?? 0);
  }
}
