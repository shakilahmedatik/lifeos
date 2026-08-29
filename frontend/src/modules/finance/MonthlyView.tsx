import { getClientMonthString } from "@lifeos/contracts";
import { Calendar, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import { DonutChart } from "../../components/ui/charts/DonutChart.js";
import { HorizontalBarChart } from "../../components/ui/charts/HorizontalBarChart.js";
import { SimpleBarChart } from "../../components/ui/charts/SimpleBarChart.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Skeleton } from "../../components/ui/Skeleton.js";
import { StatCard } from "../../components/ui/StatCard.js";
import { useFinanceSummary } from "./hooks/useFinanceSummary.js";
import { formatBDT, getTypeIcon } from "./utils.js";

interface MonthlyViewProps {
  refreshTrigger?: number;
}

const INCOME_GRADIENTS = [
  { start: "#10b981", end: "#34d399" },
  { start: "#059669", end: "#10b981" },
  { start: "#047857", end: "#059669" },
  { start: "#0d9488", end: "#14b8a6" },
  { start: "#0f766e", end: "#0d9488" },
];

const EXPENSE_BAR_SHADES = ["#f59e0b", "#d97706", "#fbbf24", "#eab308", "#b45309"];

export function MonthlyView({ refreshTrigger }: MonthlyViewProps) {
  const [yearMonth, setYearMonth] = useState(getClientMonthString());
  const { summary, breakdown, balances, loading, refresh } = useFinanceSummary(yearMonth);

  useEffect(() => {
    if (refreshTrigger !== undefined) {
      refresh();
    }
  }, [refreshTrigger, refresh]);

  const expenseBreakdown = useMemo(
    () => breakdown.filter((b) => b.kind === "expense").sort((a, b) => b.total - a.total),
    [breakdown],
  );
  const incomeBreakdown = useMemo(
    () => breakdown.filter((b) => b.kind === "income").sort((a, b) => b.total - a.total),
    [breakdown],
  );
  const totalSpent = useMemo(
    () => expenseBreakdown.reduce((acc, b) => acc + b.total, 0),
    [expenseBreakdown],
  );
  const totalEarned = useMemo(
    () => incomeBreakdown.reduce((acc, b) => acc + b.total, 0),
    [incomeBreakdown],
  );

  const expenseBarData = useMemo(
    () =>
      expenseBreakdown.map((item) => ({
        label: item.categoryName,
        value: item.total,
        color: EXPENSE_BAR_SHADES[expenseBreakdown.indexOf(item) % EXPENSE_BAR_SHADES.length],
      })),
    [expenseBreakdown],
  );

  const incomeDonutData = useMemo(
    () =>
      incomeBreakdown.map((item, index) => ({
        label: item.categoryName,
        value: item.total,
        color: INCOME_GRADIENTS[index % INCOME_GRADIENTS.length].start,
      })),
    [incomeBreakdown],
  );

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const comparisonData = summary
    ? [
        { label: "Income", value: summary.totalIncome, color: "#10b981" },
        { label: "Expenses", value: summary.totalExpense, color: "#f59e0b" },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-primary">Monthly Overview</h3>
          <p className="text-xs text-muted">Income vs. Expense summary and category breakdowns</p>
        </div>
        <div className="flex items-center gap-1.5 glass border border-border px-2.5 py-1 rounded-lg">
          <Calendar size={13} className="text-muted" />
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => {
              if (e.target.value) setYearMonth(e.target.value);
            }}
            className="bg-transparent text-xs text-primary focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            value={summary.totalIncome}
            label="Total Income"
            icon={TrendingUp}
            format={(val) => formatBDT(val)}
            className="border-emerald-500/20 hover:border-emerald-500/40"
            valueClassName="text-emerald-400 text-lg"
            iconClassName="bg-emerald-500/10"
          />
          <StatCard
            value={summary.totalExpense}
            label="Total Expenses"
            icon={TrendingDown}
            format={(val) => formatBDT(val)}
            className="border-amber-500/20 hover:border-amber-500/40"
            valueClassName="text-amber-400 text-lg"
            iconClassName="bg-amber-500/10"
          />
          <StatCard
            value={Math.abs(summary.net)}
            label="Net Flow"
            icon={Wallet}
            format={(val) => `${summary.net >= 0 ? "+ " : "- "}${formatBDT(val)}`}
            className={
              summary.net >= 0
                ? "border-emerald-500/30 hover:border-emerald-500/40"
                : "border-amber-500/30 hover:border-amber-500/40"
            }
            valueClassName={
              summary.net >= 0 ? "text-emerald-400 text-lg" : "text-amber-400 text-lg"
            }
            iconClassName={summary.net >= 0 ? "bg-emerald-500/10" : "bg-amber-500/10"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="glass flex flex-col justify-between">
          <CardHeader className="py-2.5 px-3 border-b border-border">
            <CardTitle className="text-xs font-semibold text-primary">Account Balances</CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-1">
            {balances.length === 0 ? (
              <EmptyState title="No accounts available" />
            ) : (
              <div className="space-y-1.5 max-h-50 overflow-y-auto pr-1 scrollbar-thin">
                {balances.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-2 glass rounded-lg border border-border hover:border-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getTypeIcon(acc.type)}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-primary truncate">{acc.name}</p>
                        <p className="text-[10px] text-muted capitalize">{acc.type}</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold shrink-0 ml-2 ${
                        acc.balance >= 0 ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {formatBDT(acc.balance)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass flex flex-col justify-between">
          <CardHeader className="py-2.5 px-3 border-b border-border">
            <CardTitle className="text-xs font-semibold text-primary">Expense vs Income</CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-1">
            {!summary ? (
              <EmptyState title="No data this month" />
            ) : (
              <div className="space-y-3">
                <SimpleBarChart
                  data={comparisonData}
                  height={144}
                  barRadius={4}
                  maxBarSize={32}
                  formatValue={(v) => formatBDT(v)}
                />
                <div className="flex items-center justify-center gap-4 text-[11px] pt-1 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-muted">Income:</span>
                    <span className="font-bold text-emerald-400">
                      {formatBDT(summary.totalIncome)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-muted">Expenses:</span>
                    <span className="font-bold text-amber-400">
                      {formatBDT(summary.totalExpense)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass flex flex-col justify-between">
          <CardHeader className="py-2.5 px-3 border-b border-border">
            <CardTitle className="text-xs font-semibold text-primary">Income by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-1">
            {incomeDonutData.length === 0 ? (
              <EmptyState title="No income this month" />
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <DonutChart data={incomeDonutData} size={144} formatValue={(v) => formatBDT(v)} />
                </div>
                <div className="space-y-1 max-h-22.5 overflow-y-auto pr-1 scrollbar-thin">
                  {incomeDonutData.map((item, index) => {
                    const percent =
                      totalEarned > 0 ? Math.round((item.value / totalEarned) * 100) : 0;
                    return (
                      <div
                        key={item.label}
                        className="flex items-center justify-between text-[11px] px-1 py-0.5 rounded hover:bg-card-hover"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                INCOME_GRADIENTS[index % INCOME_GRADIENTS.length].start,
                            }}
                          />
                          <span className="text-muted truncate">{item.label}</span>
                        </div>
                        <span className="font-semibold text-emerald-400 shrink-0 ml-2">
                          {formatBDT(item.value)} ({percent}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass flex flex-col justify-between">
          <CardHeader className="py-2.5 px-3 border-b border-border">
            <CardTitle className="text-xs font-semibold text-primary">
              Expense by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-1">
            {expenseBarData.length === 0 ? (
              <EmptyState title="No expenses this month" />
            ) : (
              <div className="space-y-3">
                <HorizontalBarChart
                  data={expenseBarData}
                  formatValue={(v) => formatBDT(v)}
                  barHeight={18}
                />
                <div className="space-y-1 max-h-22.5 overflow-y-auto pr-1 scrollbar-thin">
                  {expenseBarData.map((item, index) => {
                    const percent =
                      totalSpent > 0 ? Math.round((item.value / totalSpent) * 100) : 0;
                    return (
                      <div
                        key={item.label}
                        className="flex items-center justify-between text-[11px] px-1 py-0.5 rounded hover:bg-card-hover"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                EXPENSE_BAR_SHADES[index % EXPENSE_BAR_SHADES.length],
                            }}
                          />
                          <span className="text-muted truncate">{item.label}</span>
                        </div>
                        <span className="font-semibold text-amber-400 shrink-0 ml-2">
                          {formatBDT(item.value)} ({percent}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
