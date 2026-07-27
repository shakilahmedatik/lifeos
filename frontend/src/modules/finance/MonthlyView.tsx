import { useCallback, useEffect, useRef, useState } from "react";

import type { AccountWithBalance, CategoryBreakdown, MonthlySummary } from "@lifeos/contracts";
import { fetchAccountBalances, fetchCategoryBreakdown, fetchMonthlySummary } from "./api.js";

interface MonthlyViewProps {
  refreshTrigger?: number;
}

export function MonthlyView({ refreshTrigger }: MonthlyViewProps) {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [balances, setBalances] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const prevRefreshTrigger = useRef(refreshTrigger);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, breakdownData, balancesData] = await Promise.all([
        fetchMonthlySummary(yearMonth),
        fetchCategoryBreakdown(yearMonth),
        fetchAccountBalances(),
      ]);
      setSummary(summaryData);
      setBreakdown(breakdownData);
      setBalances(balancesData);
    } finally {
      setLoading(false);
    }
  }, [yearMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (refreshTrigger !== prevRefreshTrigger.current) {
      prevRefreshTrigger.current = refreshTrigger;
      loadData();
    }
  }, [refreshTrigger, loadData]);

  function formatAmount(amountMinor: number): string {
    return `৳${(amountMinor / 100).toFixed(2)}`;
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Monthly Overview</h3>
        <input
          type="month"
          value={yearMonth}
          onChange={(e) => setYearMonth(e.target.value)}
          className="px-3 py-1 border rounded"
        />
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600">Income</p>
            <p className="text-2xl font-bold text-green-700">{formatAmount(summary.totalIncome)}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">Expenses</p>
            <p className="text-2xl font-bold text-red-700">{formatAmount(summary.totalExpense)}</p>
          </div>
          <div className={`p-4 rounded-lg ${summary.net >= 0 ? "bg-blue-50" : "bg-yellow-50"}`}>
            <p className={`text-sm ${summary.net >= 0 ? "text-blue-600" : "text-yellow-600"}`}>
              Net
            </p>
            <p
              className={`text-2xl font-bold ${
                summary.net >= 0 ? "text-blue-700" : "text-yellow-700"
              }`}
            >
              {formatAmount(summary.net)}
            </p>
          </div>
        </div>
      )}

      {/* Account Balances */}
      <div>
        <h4 className="font-medium mb-2">Account Balances</h4>
        <div className="grid grid-cols-2 gap-3">
          {balances.map((account) => (
            <div key={account.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">{account.name}</span>
                <span className="text-sm text-gray-500 capitalize">{account.type}</span>
              </div>
              <p
                className={`text-lg font-semibold ${account.balance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatAmount(account.balance)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div>
        <h4 className="font-medium mb-2">Category Breakdown</h4>
        <div className="space-y-2">
          {breakdown.map((item) => (
            <div
              key={item.categoryId}
              className="flex items-center justify-between p-2 bg-white border rounded"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.kind === "income" ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span>{item.categoryName}</span>
              </div>
              <span
                className={`font-medium ${
                  item.kind === "income" ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatAmount(item.total)}
              </span>
            </div>
          ))}
          {breakdown.length === 0 && (
            <p className="text-gray-500 text-center py-4">No transactions this month</p>
          )}
        </div>
      </div>
    </div>
  );
}
