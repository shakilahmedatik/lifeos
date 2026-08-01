import type { Transaction } from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts";
import { Pencil, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppToast } from "../../components/Toast.js";
import Button from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import * as api from "./api.js";
import { useAccounts } from "./hooks/useAccounts.js";
import { useCategories } from "./hooks/useCategories.js";

interface TransactionFormProps {
  onTransactionCreated: () => void;
  onClose?: () => void;
  editTransaction?: Transaction | null;
}

export function TransactionForm({
  onTransactionCreated,
  onClose,
  editTransaction,
}: TransactionFormProps) {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { categories, loading: categoriesLoading } = useCategories();
  const [submitting, setSubmitting] = useState(false);

  const [transactionKind, setTransactionKind] = useState<"expense" | "income">("expense");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(getClientDateString());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const toast = useAppToast();
  const isEditing = !!editTransaction;

  useEffect(() => {
    if (editTransaction) {
      const cat = categories.find((c) => c.id === editTransaction.categoryId);
      if (cat) {
        setTransactionKind(cat.kind);
      }
      setAccountId(editTransaction.accountId);
      setCategoryId(editTransaction.categoryId);
      setDate(editTransaction.date);
      setAmount((editTransaction.amountMinor / 100).toString());
      setNote(editTransaction.note ?? "");
    } else {
      setTransactionKind("expense");
      setDate(getClientDateString());
      setAmount("");
      setNote("");
    }
  }, [editTransaction, categories]);

  const activeAccounts = useMemo(
    () => accounts.filter((a) => !a.archived || a.id === accountId),
    [accounts, accountId],
  );

  const filteredCategories = useMemo(
    () =>
      categories.filter((c) => c.kind === transactionKind && (!c.archived || c.id === categoryId)),
    [categories, transactionKind, categoryId],
  );

  useEffect(() => {
    if (activeAccounts.length > 0 && !accountId) {
      setAccountId(activeAccounts[0].id);
    }
  }, [activeAccounts, accountId]);

  useEffect(() => {
    if (!categoryId && filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [filteredCategories, categoryId]);

  function handleKindChange(kind: "expense" | "income") {
    setTransactionKind(kind);
    const matching = categories.filter((c) => c.kind === kind && !c.archived);
    if (matching.length > 0) {
      setCategoryId(matching[0].id);
    } else {
      setCategoryId("");
    }
  }

  function resetForm() {
    setTransactionKind("expense");
    setAccountId(activeAccounts[0]?.id ?? "");
    const defaultCats = categories.filter((c) => c.kind === "expense" && !c.archived);
    setCategoryId(defaultCats[0]?.id ?? "");
    setDate(getClientDateString());
    setAmount("");
    setNote("");
  }

  function handleAmountChange(val: string) {
    const sanitized = val.replace(/,/g, "");
    if (sanitized === "" || /^\d*\.?\d{0,2}$/.test(sanitized)) {
      setAmount(val);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId || !categoryId || !amount) return;

    const cleanAmount = amount.replace(/,/g, "").trim();
    const amountNum = Number.parseFloat(cleanAmount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    if (amountNum > 1_000_000_000_000) {
      toast.error("Amount exceeds maximum limit (1 Trillion BDT)");
      return;
    }

    setSubmitting(true);
    try {
      const amountMinor = Math.round(amountNum * 100);
      if (isEditing && editTransaction) {
        await api.updateTransaction(editTransaction.id, {
          accountId,
          categoryId,
          date,
          amountMinor,
          note: note.trim() || undefined,
        });
        toast.success("Transaction updated");
      } else {
        await api.createTransaction({
          accountId,
          categoryId,
          date,
          amountMinor,
          note: note.trim() || undefined,
        });
        toast.success("Transaction recorded");
      }
      resetForm();
      onTransactionCreated();
      onClose?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save transaction");
    } finally {
      setSubmitting(false);
    }
  }

  const loading = accountsLoading || categoriesLoading;
  const selectedCategory = categories.find((c) => c.id === categoryId);

  if (loading) return <div className="text-sm text-gray-500 py-4">Loading form...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select
          id="transaction-kind"
          label="Type"
          value={transactionKind}
          onChange={(e) => handleKindChange(e.target.value as "expense" | "income")}
          options={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
        />

        <Select
          id="account-id"
          label="Account"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
          options={activeAccounts.map((account) => ({
            value: account.id,
            label: `${account.name} (${account.type})`,
          }))}
        />

        <Select
          id="category-id"
          label="Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          options={filteredCategories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          id="transaction-date"
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <Input
          id="transaction-amount"
          label="Amount (BDT)"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder="0.00 (e.g. 5000 or 150000.50)"
          required
        />
      </div>

      <Input
        id="transaction-note"
        label="Note (optional)"
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. Monthly salary, Grocery shopping, Coffee"
      />

      <div className="flex items-center justify-between pt-2">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            selectedCategory?.kind === "income"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {selectedCategory?.kind === "income" ? "Income Transaction" : "Expense Transaction"}
        </span>

        <div className="flex gap-2">
          {onClose && (
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={submitting}
            icon={isEditing ? <Pencil size={16} /> : <Plus size={16} />}
          >
            {submitting ? "Saving..." : isEditing ? "Update Transaction" : "Add Transaction"}
          </Button>
        </div>
      </div>
    </form>
  );
}
