import type { Account, Category, NewTransactionInput } from "@lifeos/contracts";
import { useCallback, useEffect, useState } from "react";
import Button from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import { createTransaction, fetchActiveAccounts, fetchActiveCategories } from "./api.js";

interface TransactionFormProps {
  onTransactionCreated: () => void;
}

export function TransactionForm({ onTransactionCreated }: TransactionFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [accountsData, categoriesData] = await Promise.all([
        fetchActiveAccounts(),
        fetchActiveCategories(),
      ]);
      setAccounts(accountsData);
      setCategories(categoriesData);
      if (accountsData.length > 0) setAccountId(accountsData[0].id);
      if (categoriesData.length > 0) setCategoryId(categoriesData[0].id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId || !categoryId || !amount) return;

    setSubmitting(true);
    try {
      const amountMinor = Math.round(Number.parseFloat(amount) * 100);
      const input: NewTransactionInput = {
        accountId,
        categoryId,
        date,
        amountMinor,
        note: note.trim() || undefined,
      };
      await createTransaction(input);
      setAmount("");
      setNote("");
      onTransactionCreated();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Select
            id="account-id"
            label="Account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            options={accounts.map((account) => ({
              value: account.id,
              label: `${account.name} (${account.type})`,
            }))}
          />
        </div>

        <div>
          <Select
            id="category-id"
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            options={categories.map((category) => ({
              value: category.id,
              label: `${category.name} (${category.kind})`,
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Input
            id="transaction-data"
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div>
          <Input
            id="transaction-amount"
            label="Amount (BDT)"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div>
        <Input
          id="transaction-note"
          label="Note (optional)"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was this for?"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {selectedCategory?.kind === "income" ? "📈 Income" : "📉 Expense"}
        </span>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add Transaction"}
        </Button>
      </div>
    </form>
  );
}
