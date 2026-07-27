import type { Account, Category, NewTransactionInput } from "@lifeos/contracts";
import { useCallback, useEffect, useState } from "react";
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
          <label htmlFor="account-id" className="block text-sm font-medium text-gray-700 mb-1">
            Account
          </label>
          <select
            id="account-id"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="category-id" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category-id"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.kind})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="transaction-data"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date
          </label>
          <input
            id="transaction-data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label
            htmlFor="transaction-amount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Amount (BDT)
          </label>
          <input
            id="transaction-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="transaction-note" className="block text-sm font-medium text-gray-700 mb-1">
          Note (optional)
        </label>
        <input
          id="transaction-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was this for?"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {selectedCategory?.kind === "income" ? "📈 Income" : "📉 Expense"}
        </span>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add Transaction"}
        </button>
      </div>
    </form>
  );
}
