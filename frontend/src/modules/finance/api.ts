import type {
  Account,
  AccountWithBalance,
  Category,
  CategoryBreakdown,
  MonthlySummary,
  NewAccountInput,
  NewCategoryInput,
  NewTransactionInput,
  Transaction,
} from "@lifeos/contracts";
import { getDataSource } from "../../lib/dataSource.js";

// Account API
export async function fetchAccounts(): Promise<Account[]> {
  return getDataSource().getAccounts();
}

export async function fetchActiveAccounts(): Promise<Account[]> {
  return getDataSource().getActiveAccounts();
}

export async function createAccount(input: NewAccountInput): Promise<Account> {
  return getDataSource().createAccount(input);
}

export async function updateAccount(id: string, patch: Partial<NewAccountInput>): Promise<Account> {
  return getDataSource().updateAccount(id, patch);
}

export async function archiveAccount(id: string): Promise<void> {
  return getDataSource().archiveAccount(id);
}

export async function unarchiveAccount(id: string): Promise<void> {
  return getDataSource().unarchiveAccount(id);
}

export async function deleteAccount(id: string): Promise<void> {
  return getDataSource().deleteAccount(id);
}

export async function fetchAccountBalance(id: string): Promise<number> {
  return getDataSource().getAccountBalance(id);
}

// Category API
export async function fetchCategories(): Promise<Category[]> {
  return getDataSource().getCategories();
}

export async function fetchActiveCategories(): Promise<Category[]> {
  return getDataSource().getActiveCategories();
}

export async function fetchIncomeCategories(): Promise<Category[]> {
  return getDataSource().getIncomeCategories();
}

export async function fetchExpenseCategories(): Promise<Category[]> {
  return getDataSource().getExpenseCategories();
}

export async function createCategory(input: NewCategoryInput): Promise<Category> {
  return getDataSource().createCategory(input);
}

export async function updateCategory(
  id: string,
  patch: Partial<NewCategoryInput>,
): Promise<Category> {
  return getDataSource().updateCategory(id, patch);
}

export async function archiveCategory(id: string): Promise<void> {
  return getDataSource().archiveCategory(id);
}

export async function unarchiveCategory(id: string): Promise<void> {
  return getDataSource().unarchiveCategory(id);
}

export async function deleteCategory(id: string): Promise<void> {
  return getDataSource().deleteCategory(id);
}

// Transaction API
export async function fetchTransactionsByDateRange(
  startDate: string,
  endDate: string,
): Promise<Transaction[]> {
  return getDataSource().getTransactionsByDateRange(startDate, endDate);
}

export async function fetchTransactionsByAccount(accountId: string): Promise<Transaction[]> {
  return getDataSource().getTransactionsByAccount(accountId);
}

export async function createTransaction(input: NewTransactionInput): Promise<Transaction> {
  return getDataSource().createTransaction(input);
}

export async function updateTransaction(
  id: string,
  patch: Partial<NewTransactionInput>,
): Promise<Transaction> {
  return getDataSource().updateTransaction(id, patch);
}

export async function deleteTransaction(id: string): Promise<void> {
  return getDataSource().deleteTransaction(id);
}

export async function createTransfer(
  fromAccountId: string,
  toAccountId: string,
  amountMinor: number,
  date: string,
  note?: string,
): Promise<{ from: Transaction; to: Transaction }> {
  return getDataSource().createTransfer(fromAccountId, toAccountId, amountMinor, date, note);
}

// Report API
export async function fetchMonthlySummary(yearMonth: string): Promise<MonthlySummary> {
  return getDataSource().getMonthlySummary(yearMonth);
}

export async function fetchCategoryBreakdown(yearMonth: string): Promise<CategoryBreakdown[]> {
  return getDataSource().getCategoryBreakdown(yearMonth);
}

export async function fetchMonthlyTransactions(yearMonth: string): Promise<Transaction[]> {
  return getDataSource().getMonthlyTransactions(yearMonth);
}

export async function fetchAccountBalances(): Promise<AccountWithBalance[]> {
  return getDataSource().getAccountBalances();
}
