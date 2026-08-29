import { DEFAULT_FINANCE_CATEGORIES, type Transaction } from "@lifeos/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useAppToast } from "../../components/Toast.js";
import Badge from "../../components/ui/Badge.js";
import Button from "../../components/ui/Button.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import { Skeleton } from "../../components/ui/Skeleton.js";
import { TiltCard } from "../../components/ui/TiltCard.js";
import { queryKeys } from "../../lib/queryKeys.js";
import { deleteTransaction as apiDeleteTransaction } from "./api.js";
import { useAccounts } from "./hooks/useAccounts.js";
import { useCategories } from "./hooks/useCategories.js";
import { useTransactions } from "./hooks/useTransactions.js";
import { formatBDT } from "./utils.js";

interface TransactionListProps {
  refreshTrigger?: number;
  onDataChange?: () => void;
  onEditTransaction?: (tx: Transaction) => void;
}

const INCOME_EMERALD = "text-emerald-400";
const EXPENSE_AMBER = "text-amber-400";

const TransactionItem = memo(function TransactionItem({
  tx,
  categoryName,
  accountName,
  isIncome,
  onEdit,
  onDelete,
}: {
  tx: Transaction;
  categoryName: string;
  accountName: string;
  isIncome: boolean;
  onEdit?: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <TiltCard className="flex items-center justify-between p-2.5 glass border border-border rounded-lg hover:border-accent/30 transition-colors">
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-primary">{categoryName}</span>
          <Badge variant={isIncome ? "success" : "warning"} className="text-[10px] py-0 px-1.5">
            {accountName}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted">
            {new Date(tx.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          {tx.note && (
            <span className="text-[11px] text-secondary truncate max-w-35">{tx.note}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 relative z-10 shrink-0">
        <span className={`text-xs font-bold ${isIncome ? INCOME_EMERALD : EXPENSE_AMBER}`}>
          {isIncome ? "+" : "-"} {formatBDT(tx.amountMinor)}
        </span>
        {onEdit && (
          <Button
            size="sm"
            variant="secondary"
            className="p-1 text-muted hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(tx);
            }}
            title="Edit Transaction"
          >
            <Pencil size={12} />
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          className="p-1 text-muted hover:text-amber-400"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(tx.id);
          }}
          title="Delete Transaction"
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </TiltCard>
  );
});

const TransactionSection = memo(function TransactionSection({
  title,
  transactions,
  categoryMap,
  accountMap,
  onEdit,
  onDelete,
}: {
  title: string;
  transactions: Transaction[];
  categoryMap: Map<string, { name: string; kind: "income" | "expense" }>;
  accountMap: Map<string, { name: string }>;
  onEdit?: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        title={`No ${title.toLowerCase()}`}
        description={`No ${title.toLowerCase()} found for selected filters.`}
      />
    );
  }

  return (
    <div className="space-y-1.5 max-h-125 overflow-y-auto pr-1 scrollbar-thin">
      {transactions.map((tx) => {
        const category = categoryMap.get(tx.categoryId);
        const account = accountMap.get(tx.accountId);
        const isIncome = category?.kind === "income";

        return (
          <TransactionItem
            key={tx.id}
            tx={tx}
            categoryName={category?.name ?? "Unknown Category"}
            accountName={account?.name ?? "Unknown Account"}
            isIncome={isIncome}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
});

export function TransactionList({
  refreshTrigger,
  onDataChange,
  onEditTransaction,
}: TransactionListProps) {
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  });
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { transactions, loading, refresh } = useTransactions(startDate, endDate);
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const toast = useAppToast();

  useEffect(() => {
    if (refreshTrigger !== undefined) {
      refresh();
    }
  }, [refreshTrigger, refresh]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await apiDeleteTransaction(id);
        await queryClient.invalidateQueries({ queryKey: ["finance"] });
        await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
        toast.success("Transaction deleted");
        refresh();
        onDataChange?.();
      } catch {
        toast.error("Failed to delete transaction");
      }
    },
    [toast, refresh, onDataChange, queryClient],
  );

  const handleDeleteTarget = useCallback((id: string) => setDeleteTargetId(id), []);

  const categoryMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; kind: "income" | "expense" }>();
    for (const def of DEFAULT_FINANCE_CATEGORIES) {
      map.set(def.id, { id: def.id, name: def.name, kind: def.kind });
      map.set(def.name.toLowerCase(), { id: def.id, name: def.name, kind: def.kind });
    }
    for (const c of categories) {
      map.set(c.id, { id: c.id, name: c.name, kind: c.kind });
      map.set(c.name.toLowerCase(), { id: c.id, name: c.name, kind: c.kind });
    }
    return map;
  }, [categories]);

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((t) => {
        if (selectedAccountId && t.accountId !== selectedAccountId) return false;
        if (selectedCategoryId && t.categoryId !== selectedCategoryId) return false;
        return true;
      }),
    [transactions, selectedAccountId, selectedCategoryId],
  );

  const incomeTransactions = useMemo(
    () =>
      filteredTransactions.filter((t) => {
        const cat = categoryMap.get(t.categoryId) || categoryMap.get(t.categoryId.toLowerCase());
        if (cat) return cat.kind === "income";
        if (t.transferPairId) return t.note?.toLowerCase().includes("from") ?? false;
        return false;
      }),
    [filteredTransactions, categoryMap],
  );

  const expenseTransactions = useMemo(
    () =>
      filteredTransactions.filter((t) => {
        const cat = categoryMap.get(t.categoryId) || categoryMap.get(t.categoryId.toLowerCase());
        if (cat) return cat.kind === "expense";
        if (t.transferPairId) return t.note?.toLowerCase().includes("to") ?? true;
        return !incomeTransactions.includes(t);
      }),
    [filteredTransactions, categoryMap, incomeTransactions],
  );

  const totalIncomeMinor = useMemo(
    () => incomeTransactions.reduce((acc, t) => acc + t.amountMinor, 0),
    [incomeTransactions],
  );
  const totalExpenseMinor = useMemo(
    () => expenseTransactions.reduce((acc, t) => acc + t.amountMinor, 0),
    [expenseTransactions],
  );

  const selectedCategory = selectedCategoryId ? categoryMap.get(selectedCategoryId) : null;
  const isIncomeCategoryFilter = selectedCategory?.kind === "income";
  const isExpenseCategoryFilter = selectedCategory?.kind === "expense";

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-primary">Transaction History</h3>
          <p className="text-xs text-muted">Filter, search, and manage financial records</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs py-1 px-2"
          />
          <span className="text-muted text-xs">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs py-1 px-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2.5 glass border border-border rounded-xl">
        <Select
          label="Filter by Account"
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          options={[
            { value: "", label: "All Accounts" },
            ...accounts.map((a) => ({ value: a.id, label: a.name })),
          ]}
        />
        <Select
          label="Filter by Category"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          options={[
            { value: "", label: "All Categories" },
            ...categories.map((c) => ({ value: c.id, label: `${c.name} (${c.kind})` })),
          ]}
        />
      </div>

      {filteredTransactions.length === 0 ? (
        <EmptyState
          title="No transactions found"
          description="Try adjusting your date range or filters, or log a new transaction."
        />
      ) : (
        <div
          className={`grid ${
            isIncomeCategoryFilter || isExpenseCategoryFilter
              ? "grid-cols-1"
              : "grid-cols-1 md:grid-cols-2"
          } gap-4 items-start`}
        >
          {(!isExpenseCategoryFilter || incomeTransactions.length > 0) && (
            <div className="space-y-2.5 p-3 rounded-xl glass border border-emerald-500/10">
              <div className="flex items-center justify-between pb-1.5 border-b border-emerald-500/20">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Income ({incomeTransactions.length})
                </h4>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  + {formatBDT(totalIncomeMinor)}
                </span>
              </div>
              <TransactionSection
                title="Income"
                transactions={incomeTransactions}
                categoryMap={categoryMap}
                accountMap={accountMap}
                onEdit={onEditTransaction}
                onDelete={handleDeleteTarget}
              />
            </div>
          )}

          {(!isIncomeCategoryFilter || expenseTransactions.length > 0) && (
            <div className="space-y-2.5 p-3 rounded-xl glass border border-amber-500/10">
              <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/20">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Expenses ({expenseTransactions.length})
                </h4>
                <span className="text-xs font-mono font-bold text-amber-400">
                  - {formatBDT(totalExpenseMinor)}
                </span>
              </div>
              <TransactionSection
                title="Expenses"
                transactions={expenseTransactions}
                categoryMap={categoryMap}
                accountMap={accountMap}
                onEdit={onEditTransaction}
                onDelete={handleDeleteTarget}
              />
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTargetId}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction record? This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (!deleteTargetId) return;
          await handleDelete(deleteTargetId);
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
}
