import { useCallback, useEffect, useRef, useState } from "react";

import type { Category, Transaction } from "@lifeos/contracts";
import { deleteTransaction, fetchActiveCategories, fetchTransactionsByDateRange } from "./api.js";

interface TransactionListProps {
  refreshTrigger?: number;
}

export function TransactionList({ refreshTrigger }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const prevRefreshTrigger = useRef(refreshTrigger);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        fetchTransactionsByDateRange(startDate, endDate),
        fetchActiveCategories(),
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (refreshTrigger !== prevRefreshTrigger.current) {
      prevRefreshTrigger.current = refreshTrigger;
      loadData();
    }
  }, [refreshTrigger, loadData]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    await deleteTransaction(id);
    loadData();
  }

  function getCategoryName(categoryId: string): string {
    return categories.find((c) => c.id === categoryId)?.name ?? "Unknown";
  }

  function formatAmount(amountMinor: number): string {
    return `৳${(amountMinor / 100).toFixed(2)}`;
  }

  if (loading) return <div className="text-gray-500">Loading transactions...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Transactions</h3>
        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1 text-sm border rounded"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1 text-sm border rounded"
          />
        </div>
      </div>

      <div className="space-y-2">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 bg-white border rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{transaction.date}</span>
                <span className="font-medium">{getCategoryName(transaction.categoryId)}</span>
              </div>
              {transaction.note && <p className="text-sm text-gray-500 mt-1">{transaction.note}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`font-semibold ${
                  transaction.categoryId.startsWith("cat-income")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {transaction.categoryId.startsWith("cat-income") ? "+" : "-"}
                {formatAmount(transaction.amountMinor)}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(transaction.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <p className="text-gray-500 text-center py-4">No transactions in this period</p>
        )}
      </div>
    </div>
  );
}
