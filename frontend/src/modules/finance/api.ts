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
import { request } from "../../lib/api.js";

const API_BASE = "/api/finance";

// Account API
export async function fetchAccounts(): Promise<Account[]> {
  return request<Account[]>(`${API_BASE}/accounts`);
}

export async function fetchActiveAccounts(): Promise<Account[]> {
  return request<Account[]>(`${API_BASE}/accounts/active`);
}

export async function createAccount(input: NewAccountInput): Promise<Account> {
  return request<Account>(`${API_BASE}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateAccount(id: string, patch: Partial<NewAccountInput>): Promise<Account> {
  return request<Account>(`${API_BASE}/accounts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function archiveAccount(id: string): Promise<void> {
  return request<void>(`${API_BASE}/accounts/${id}/archive`, { method: "POST" });
}

export async function unarchiveAccount(id: string): Promise<void> {
  return request<void>(`${API_BASE}/accounts/${id}/unarchive`, { method: "POST" });
}

export async function deleteAccount(id: string): Promise<void> {
  return request<void>(`${API_BASE}/accounts/${id}`, { method: "DELETE" });
}

export async function fetchAccountBalance(id: string): Promise<number> {
  const data = await request<{ balance: number }>(`${API_BASE}/accounts/${id}/balance`);
  return data.balance;
}

// Category API
export async function fetchCategories(): Promise<Category[]> {
  return request<Category[]>(`${API_BASE}/categories`);
}

export async function fetchActiveCategories(): Promise<Category[]> {
  return request<Category[]>(`${API_BASE}/categories/active`);
}

export async function fetchIncomeCategories(): Promise<Category[]> {
  return request<Category[]>(`${API_BASE}/categories/income`);
}

export async function fetchExpenseCategories(): Promise<Category[]> {
  return request<Category[]>(`${API_BASE}/categories/expense`);
}

export async function createCategory(input: NewCategoryInput): Promise<Category> {
  return request<Category>(`${API_BASE}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateCategory(
  id: string,
  patch: Partial<NewCategoryInput>,
): Promise<Category> {
  return request<Category>(`${API_BASE}/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function archiveCategory(id: string): Promise<void> {
  return request<void>(`${API_BASE}/categories/${id}/archive`, { method: "POST" });
}

export async function unarchiveCategory(id: string): Promise<void> {
  return request<void>(`${API_BASE}/categories/${id}/unarchive`, { method: "POST" });
}

export async function deleteCategory(id: string): Promise<void> {
  return request<void>(`${API_BASE}/categories/${id}`, { method: "DELETE" });
}

// Transaction API
export async function fetchTransactionsByDateRange(
  startDate: string,
  endDate: string,
): Promise<Transaction[]> {
  return request<Transaction[]>(
    `${API_BASE}/transactions?startDate=${startDate}&endDate=${endDate}`,
  );
}

export async function fetchTransactionsByAccount(accountId: string): Promise<Transaction[]> {
  return request<Transaction[]>(`${API_BASE}/transactions?accountId=${accountId}`);
}

export async function createTransaction(input: NewTransactionInput): Promise<Transaction> {
  return request<Transaction>(`${API_BASE}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateTransaction(
  id: string,
  patch: Partial<NewTransactionInput>,
): Promise<Transaction> {
  return request<Transaction>(`${API_BASE}/transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  return request<void>(`${API_BASE}/transactions/${id}`, { method: "DELETE" });
}

export async function createTransfer(
  fromAccountId: string,
  toAccountId: string,
  amountMinor: number,
  date: string,
  note?: string,
): Promise<{ from: Transaction; to: Transaction }> {
  return request<{ from: Transaction; to: Transaction }>(`${API_BASE}/transfers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromAccountId, toAccountId, amountMinor, date, note }),
  });
}

// Report API
export async function fetchMonthlySummary(yearMonth: string): Promise<MonthlySummary> {
  return request<MonthlySummary>(`${API_BASE}/monthly/${yearMonth}`);
}

export async function fetchCategoryBreakdown(yearMonth: string): Promise<CategoryBreakdown[]> {
  return request<CategoryBreakdown[]>(`${API_BASE}/monthly/${yearMonth}/breakdown`);
}

export async function fetchMonthlyTransactions(yearMonth: string): Promise<Transaction[]> {
  return request<Transaction[]>(`${API_BASE}/monthly/${yearMonth}/transactions`);
}

export async function fetchAccountBalances(): Promise<AccountWithBalance[]> {
  return request<AccountWithBalance[]>(`${API_BASE}/balances`);
}
