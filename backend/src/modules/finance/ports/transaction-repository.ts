import type { NewTransactionInput, Transaction } from "../domain/types.js";

export interface TransactionRepository {
  getById(id: string): Transaction | undefined;
  getByDateRange(startDate: string, endDate: string): Transaction[];
  getByAccountId(accountId: string): Transaction[];
  create(id: string, input: NewTransactionInput): Transaction;
  update(id: string, patch: Partial<NewTransactionInput>): Transaction | undefined;
  delete(id: string): boolean;
  getMonthlyTotals(yearMonth: string): { totalIncome: number; totalExpense: number };
  getCategoryBreakdown(yearMonth: string): { categoryId: string; total: number }[];
  getAccountBalance(accountId: string): number;
}
