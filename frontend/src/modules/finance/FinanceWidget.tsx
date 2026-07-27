import type { MonthlySummary } from "@lifeos/contracts";
import { useCallback, useEffect, useState } from "react";
import { fetchMonthlySummary } from "./api.js";

export function FinanceWidget() {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    try {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const data = await fetchMonthlySummary(yearMonth);
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  function formatAmount(amountMinor: number): string {
    return `৳${(amountMinor / 100).toFixed(0)}`;
  }

  if (loading) return <div className="text-gray-500">Loading finance...</div>;
  if (!summary) return <div className="text-gray-500">No data</div>;

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Finance This Month</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Income</span>
          <span className="font-semibold text-green-600">{formatAmount(summary.totalIncome)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Expenses</span>
          <span className="font-semibold text-red-600">{formatAmount(summary.totalExpense)}</span>
        </div>
        <div className="border-t pt-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">Net</span>
            <span className={`font-bold ${summary.net >= 0 ? "text-blue-600" : "text-yellow-600"}`}>
              {formatAmount(summary.net)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
