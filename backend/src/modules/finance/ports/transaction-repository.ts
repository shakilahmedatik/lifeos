import type { NewTransactionInput, Transaction } from "../domain/types.js";

export interface TransactionRepository {
  getById(id: string, userId: string): Promise<Transaction | undefined>;
  getByDateRange(startDate: string, endDate: string, userId: string): Promise<Transaction[]>;
  getByAccountId(accountId: string, userId: string): Promise<Transaction[]>;
  getByAccountAndDateRange(
    accountId: string,
    startDate: string,
    endDate: string,
    userId: string,
  ): Promise<Transaction[]>;
  getByCategoryId(categoryId: string, userId: string): Promise<Transaction[]>;
  create(id: string, input: NewTransactionInput, userId: string): Promise<Transaction>;
  update(
    id: string,
    patch: Partial<NewTransactionInput>,
    userId: string,
  ): Promise<Transaction | undefined>;
  delete(id: string, userId: string): Promise<boolean>;
  getMonthlyTotals(
    yearMonth: string,
    userId: string,
  ): Promise<{ totalIncome: number; totalExpense: number }>;
  getCategoryBreakdown(
    yearMonth: string,
    userId: string,
  ): Promise<{ categoryId: string; total: number }[]>;
  getAccountBalance(accountId: string, userId: string): Promise<number>;
}
