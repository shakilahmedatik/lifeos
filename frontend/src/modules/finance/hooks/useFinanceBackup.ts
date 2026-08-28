import type { AccountType, CategoryKind } from "@lifeos/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/queryKeys.js";
import {
  createAccount,
  createCategory,
  createTransaction,
  fetchAccounts,
  fetchCategories,
  fetchTransactionsByDateRange,
} from "../api.js";

export interface FinanceBackupAccount {
  id?: string;
  name?: string;
  type?: AccountType;
}

export interface FinanceBackupCategory {
  id?: string;
  name?: string;
  kind?: CategoryKind;
}

export interface FinanceBackupTransaction {
  id?: string;
  accountId?: string;
  categoryId?: string;
  date?: string;
  amountMinor?: number;
  currency?: string;
  note?: string;
}

export interface FinanceBackupData {
  version?: string;
  exportedAt?: string;
  accounts?: FinanceBackupAccount[];
  categories?: FinanceBackupCategory[];
  transactions?: FinanceBackupTransaction[];
}

export function useFinanceBackup(onImportComplete?: () => void) {
  const queryClient = useQueryClient();
  const exportCsv = async () => {
    const startDate = "1900-01-01";
    const endDate = "2100-01-01";

    const [transactions, categories, accounts] = await Promise.all([
      fetchTransactionsByDateRange(startDate, endDate),
      fetchCategories(),
      fetchAccounts(),
    ]);

    const catMap = new Map(categories.map((c) => [c.id, c]));
    const accMap = new Map(accounts.map((a) => [a.id, a]));

    const headers = ["ID", "Date", "Account", "Category", "Type", "Amount (BDT)", "Note"];
    const rows = transactions.map((tx) => {
      const cat = catMap.get(tx.categoryId);
      const acc = accMap.get(tx.accountId);
      const type = cat?.kind ?? "expense";
      const amount = (tx.amountMinor / 100).toFixed(2);
      const note = tx.note ? `"${tx.note.replace(/"/g, '""')}"` : "";

      return [
        tx.id,
        tx.date,
        `"${acc?.name ?? tx.accountId}"`,
        `"${cat?.name ?? tx.categoryId}"`,
        type,
        amount,
        note,
      ].join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  };

  const exportJson = async (): Promise<FinanceBackupData> => {
    const now = new Date();
    const startDate = "1900-01-01";
    const endDate = "2100-01-01";

    const [accounts, categories, transactions] = await Promise.all([
      fetchAccounts(),
      fetchCategories(),
      fetchTransactionsByDateRange(startDate, endDate),
    ]);

    return {
      version: "1.0",
      exportedAt: now.toISOString(),
      accounts,
      categories,
      transactions,
    };
  };

  const importJson = async (data: FinanceBackupData) => {
    if (!data || (!data.accounts && !data.categories && !data.transactions)) {
      return {
        success: false,
        message: "Invalid backup file structure. Ensure it contains finance records.",
      };
    }

    const existingAccounts = await fetchAccounts();
    const existingCategories = await fetchCategories();

    const accountIdMap = new Map<string, string>();
    const categoryIdMap = new Map<string, string>();

    let accountsAdded = 0;
    let categoriesAdded = 0;
    let transactionsAdded = 0;

    if (Array.isArray(data.accounts)) {
      for (const acc of data.accounts) {
        try {
          if (!acc.name || !acc.type) continue;
          const matched = existingAccounts.find(
            (ea) => ea.name === acc.name && ea.type === acc.type,
          );
          if (matched) {
            if (acc.id) accountIdMap.set(acc.id, matched.id);
          } else {
            const created = await createAccount({ name: acc.name, type: acc.type });
            if (acc.id) accountIdMap.set(acc.id, created.id);
            accountsAdded++;
          }
        } catch {}
      }
    }

    if (Array.isArray(data.categories)) {
      for (const cat of data.categories) {
        try {
          if (!cat.name || !cat.kind) continue;
          const matched = existingCategories.find(
            (ec) => ec.name === cat.name && ec.kind === cat.kind,
          );
          if (matched) {
            if (cat.id) categoryIdMap.set(cat.id, matched.id);
          } else {
            const created = await createCategory({ name: cat.name, kind: cat.kind });
            if (cat.id) categoryIdMap.set(cat.id, created.id);
            categoriesAdded++;
          }
        } catch {}
      }
    }

    if (Array.isArray(data.transactions)) {
      for (const tx of data.transactions) {
        try {
          if (!tx.accountId || !tx.categoryId || !tx.date || typeof tx.amountMinor !== "number") {
            continue;
          }
          const targetAccId = accountIdMap.get(tx.accountId) ?? tx.accountId;
          const targetCatId = categoryIdMap.get(tx.categoryId) ?? tx.categoryId;

          await createTransaction({
            accountId: targetAccId,
            categoryId: targetCatId,
            date: tx.date,
            amountMinor: tx.amountMinor,
            currency: tx.currency,
            note: tx.note,
          });
          transactionsAdded++;
        } catch {}
      }
    }

    await queryClient.invalidateQueries({ queryKey: ["finance"] });
    await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });

    onImportComplete?.();

    return {
      success: true,
      message: `Import complete! Restored ${accountsAdded} accounts, ${categoriesAdded} categories, and ${transactionsAdded} transactions.`,
    };
  };

  return { exportCsv, exportJson, importJson };
}
