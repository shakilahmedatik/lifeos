export type AccountType = "cash" | "bank" | "card" | "savings";

export type CategoryKind = "income" | "expense";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewAccountInput {
  name: string;
  type: AccountType;
}

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewCategoryInput {
  name: string;
  kind: CategoryKind;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  date: string;
  amountMinor: number;
  currency: string;
  note?: string;
  transferPairId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewTransactionInput {
  accountId: string;
  categoryId: string;
  date: string;
  amountMinor: number;
  currency?: string;
  note?: string;
  transferPairId?: string;
}

export interface MonthlySummary {
  yearMonth: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  kind: CategoryKind;
  total: number;
}

export interface AccountWithBalance extends Account {
  balance: number;
}
