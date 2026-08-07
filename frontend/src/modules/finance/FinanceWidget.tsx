import { ChevronRight, Wallet } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Skeleton } from "../../components/ui/Skeleton.js";
import { TiltCard } from "../../components/ui/TiltCard.js";
import { useFinanceSummary } from "./hooks/useFinanceSummary.js";
import { formatBDT } from "./utils.js";

interface FinanceWidgetProps {
  onViewAll?: () => void;
}

export function FinanceWidget({ onViewAll }: FinanceWidgetProps) {
  const { summary, loading } = useFinanceSummary();

  if (loading) {
    return (
      <TiltCard className="p-4 bg-card border border-border rounded-xl">
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </TiltCard>
    );
  }

  if (!summary) {
    return (
      <TiltCard className="p-4 bg-card border border-border rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary text-sm font-medium">
            <Wallet size={16} className="text-emerald-400" />
            <span>Finance</span>
          </div>
        </div>
        <EmptyState title="No transactions yet this month" className="py-4" />
      </TiltCard>
    );
  }

  return (
    <TiltCard className="p-4 bg-card border border-border rounded-xl shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary text-sm font-medium">
          <Wallet size={16} className="text-emerald-400" />
          <span>Finance This Month</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted font-mono">{summary.yearMonth}</span>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-0.5"
            >
              Details <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border">
        <div>
          <p className="text-xs text-muted">Income</p>
          <p className="text-sm font-semibold text-emerald-400">
            {formatBDT(summary.totalIncome, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Expenses</p>
          <p className="text-sm font-semibold text-red-400">{formatBDT(summary.totalExpense, 0)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Net Flow</p>
          <p
            className={`text-sm font-bold ${summary.net >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {formatBDT(Math.abs(summary.net), 0)}
          </p>
        </div>
      </div>
    </TiltCard>
  );
}
