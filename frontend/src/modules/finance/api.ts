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
import { fetchWithAuth } from "../../lib/api.js";

const API_BASE = "/api/finance";

// Account API
export async function fetchAccounts(): Promise<Account[]> {
  const res = await fetchWithAuth(`${API_BASE}/accounts`);
  if (!res.ok) throw new Error("Failed to fetch accounts");
  return res.json();
}

export async function fetchActiveAccounts(): Promise<Account[]> {
  const res = await fetchWithAuth(`${API_BASE}/accounts/active`);
  if (!res.ok) throw new Error("Failed to fetch active accounts");
  return res.json();
}

export async function createAccount(input: NewAccountInput): Promise<Account> {
  const res = await fetchWithAuth(`${API_BASE}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create account");
  return res.json();
}

export async function updateAccount(id: string, patch: Partial<NewAccountInput>): Promise<Account> {
  const res = await fetchWithAuth(`${API_BASE}/accounts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update account");
  return res.json();
}

export async function archiveAccount(id: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/accounts/${id}/archive`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to archive account");
}

export async function fetchAccountBalance(id: string): Promise<number> {
  const res = await fetchWithAuth(`${API_BASE}/accounts/${id}/balance`);
  if (!res.ok) throw new Error("Failed to fetch account balance");
  const data = await res.json();
  return data.balance;
}

// Category API
export async function fetchCategories(): Promise<Category[]> {
  const res = await fetchWithAuth(`${API_BASE}/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function fetchActiveCategories(): Promise<Category[]> {
  const res = await fetchWithAuth(`${API_BASE}/categories/active`);
  if (!res.ok) throw new Error("Failed to fetch active categories");
  return res.json();
}

export async function fetchIncomeCategories(): Promise<Category[]> {
  const res = await fetchWithAuth(`${API_BASE}/categories/income`);
  if (!res.ok) throw new Error("Failed to fetch income categories");
  return res.json();
}

export async function fetchExpenseCategories(): Promise<Category[]> {
  const res = await fetchWithAuth(`${API_BASE}/categories/expense`);
  if (!res.ok) throw new Error("Failed to fetch expense categories");
  return res.json();
}

export async function createCategory(input: NewCategoryInput): Promise<Category> {
  const res = await fetchWithAuth(`${API_BASE}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create category");
  return res.json();
}

export async function archiveCategory(id: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/categories/${id}/archive`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to archive category");
}

// Transaction API
export async function fetchTransactionsByDateRange(
  startDate: string,
  endDate: string,
): Promise<Transaction[]> {
  const res = await fetchWithAuth(
    `${API_BASE}/transactions?startDate=${startDate}&endDate=${endDate}`,
  );
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function fetchTransactionsByAccount(accountId: string): Promise<Transaction[]> {
  const res = await fetchWithAuth(`${API_BASE}/transactions?accountId=${accountId}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function createTransaction(input: NewTransactionInput): Promise<Transaction> {
  const res = await fetchWithAuth(`${API_BASE}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create transaction");
  }
  return res.json();
}

export async function updateTransaction(
  id: string,
  patch: Partial<NewTransactionInput>,
): Promise<Transaction> {
  const res = await fetchWithAuth(`${API_BASE}/transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update transaction");
  return res.json();
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/transactions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete transaction");
}

export async function createTransfer(
  fromAccountId: string,
  toAccountId: string,
  amountMinor: number,
  date: string,
  note?: string,
): Promise<{ from: Transaction; to: Transaction }> {
  const res = await fetchWithAuth(`${API_BASE}/transfers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromAccountId, toAccountId, amountMinor, date, note }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create transfer");
  }
  return res.json();
}

// Report API
export async function fetchMonthlySummary(yearMonth: string): Promise<MonthlySummary> {
  const res = await fetchWithAuth(`${API_BASE}/monthly/${yearMonth}`);
  if (!res.ok) throw new Error("Failed to fetch monthly summary");
  return res.json();
}

export async function fetchCategoryBreakdown(yearMonth: string): Promise<CategoryBreakdown[]> {
  const res = await fetchWithAuth(`${API_BASE}/monthly/${yearMonth}/breakdown`);
  if (!res.ok) throw new Error("Failed to fetch category breakdown");
  return res.json();
}

export async function fetchMonthlyTransactions(yearMonth: string): Promise<Transaction[]> {
  const res = await fetchWithAuth(`${API_BASE}/monthly/${yearMonth}/transactions`);
  if (!res.ok) throw new Error("Failed to fetch monthly transactions");
  return res.json();
}

export async function fetchAccountBalances(): Promise<AccountWithBalance[]> {
  const res = await fetchWithAuth(`${API_BASE}/balances`);
  if (!res.ok) throw new Error("Failed to fetch account balances");
  return res.json();
}
