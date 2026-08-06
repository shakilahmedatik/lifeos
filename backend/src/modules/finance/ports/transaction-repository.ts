import type { NewTransactionInput, Transaction } from "../domain/types.js";

export interface TransactionRepository {
  getById(id: string): Promise<Transaction | undefined>;
  getByDateRange(startDate: string, endDate: string): Promise<Transaction[]>;
  getByAccountId(accountId: string): Promise<Transaction[]>;
  getByAccountAndDateRange(
    accountId: string,
    startDate: string,
    endDate: string,
  ): Promise<Transaction[]>;
  getByCategoryId(categoryId: string): Promise<Transaction[]>;
  create(id: string, input: NewTransactionInput): Promise<Transaction>;
  update(id: string, patch: Partial<NewTransactionInput>): Promise<Transaction | undefined>;
  delete(id: string): Promise<boolean>;
  getMonthlyTotals(yearMonth: string): Promise<{ totalIncome: number; totalExpense: number }>;
  getCategoryBreakdown(yearMonth: string): Promise<{ categoryId: string; total: number }[]>;
  getAccountBalance(accountId: string): Promise<number>;
}
