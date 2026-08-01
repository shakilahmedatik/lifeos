import { getClientMonthString } from "@lifeos/contracts";
import { Calendar, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Skeleton } from "../../components/ui/Skeleton.js";
import { StatCard } from "../../components/ui/StatCard.js";
import { TiltCard } from "../../components/ui/TiltCard.js";
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

const EXPENSE_GRADIENT = { start: "#f59e0b", end: "#fbbf24" };
const EXPENSE_BAR_SHADES = ["#f59e0b", "#d97706", "#fbbf24", "#eab308", "#b45309"];

function AnimatedAmount({
  value,
  className = "",
  prefix = "",
}: {
  value: number;
  className?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasIntersectionObserver = typeof window !== "undefined" && "IntersectionObserver" in window;
  const inView = hasIntersectionObserver ? useInView(ref, { once: true, amount: 0.5 }) : true;
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      fromRef.current = value;
      setDisplay(Math.round(value));
      return;
    }
    const controls = animate(fromRef.current, value, {
      duration: 0.8,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    fromRef.current = value;
    return () => controls.stop();
  }, [value, inView, reduce]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {formatBDT(display)}
    </span>
  );
}

export function MonthlyView({ refreshTrigger }: MonthlyViewProps) {
  const [yearMonth, setYearMonth] = useState(getClientMonthString());
  const { summary, breakdown, balances, loading, refresh } = useFinanceSummary(yearMonth);
  const prevRefreshTrigger = useRef(refreshTrigger);

  useEffect(() => {
    if (refreshTrigger !== prevRefreshTrigger.current) {
      prevRefreshTrigger.current = refreshTrigger;
      refresh();
    }
  }, [refreshTrigger, refresh]);

  const expenseBreakdown = breakdown
    .filter((b) => b.kind === "expense")
    .sort((a, b) => b.total - a.total);
  const incomeBreakdown = breakdown
    .filter((b) => b.kind === "income")
    .sort((a, b) => b.total - a.total);
  const totalSpent = expenseBreakdown.reduce((acc, b) => acc + b.total, 0);
  const totalEarned = incomeBreakdown.reduce((acc, b) => acc + b.total, 0);

  const expenseBarData = expenseBreakdown.map((item) => ({
    name: item.categoryName,
    value: item.total,
    percent: totalSpent > 0 ? Math.round((item.total / totalSpent) * 100) : 0,
  }));

  const incomeDonutData = incomeBreakdown.map((item) => ({
    name: item.categoryName,
    value: item.total,
  }));

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
            onChange={(e) => setYearMonth(e.target.value)}
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

      {/* 2x2 Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Account Balances Card */}
        <Card className="glass flex flex-col justify-between">
          <CardHeader className="py-2.5 px-3 border-b border-border">
            <CardTitle className="text-xs font-semibold text-primary">Account Balances</CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-1">
            {balances.length === 0 ? (
              <EmptyState title="No accounts available" />
            ) : (
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
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
                      <AnimatedAmount value={acc.balance} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense vs Income Card */}
        <Card className="glass flex flex-col justify-between">
          <CardHeader className="py-2.5 px-3 border-b border-border">
            <CardTitle className="text-xs font-semibold text-primary">Expense vs Income</CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-1">
            {!summary ? (
              <EmptyState title="No data this month" />
            ) : (
              <div className="space-y-3">
                <div style={{ width: "100%", height: 144 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={100}>
                    <BarChart
                      data={[
                        {
                          name: "Income",
                          value: summary.totalIncome,
                          color: "#10b981",
                        },
                        {
                          name: "Expenses",
                          value: summary.totalExpense,
                          color: "#f59e0b",
                        },
                      ]}
                      margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                      barSize={32}
                      barGap={12}
                    >
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        dy={3}
                      />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.03)" }}
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            const data = payload[0].payload;
                            const total = summary.totalIncome + summary.totalExpense;
                            return (
                              <div className="glass p-2 rounded-lg text-xs shadow-2xl border border-border">
                                <p className="font-semibold text-primary mb-0.5">{data.name}</p>
                                <p
                                  className={
                                    data.name === "Income"
                                      ? "text-emerald-400 font-bold"
                                      : "text-amber-400 font-bold"
                                  }
                                >
                                  {formatBDT(data.value)}
                                </p>
                                <p className="text-[10px] text-muted">
                                  {total > 0
                                    ? `${Math.round((data.value / total) * 100)}% of total`
                                    : "0%"}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="value"
                        radius={[4, 4, 0, 0]}
                        background={{ fill: "rgba(31, 41, 55, 0.3)" }}
                      >
                        {[
                          { name: "Income", color: "#10b981" },
                          { name: "Expenses", color: "#f59e0b" },
                        ].map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
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

        {/* Income by Category Card */}
        <Card className="glass flex flex-col justify-between">
          <CardHeader className="py-2.5 px-3 border-b border-border">
            <CardTitle className="text-xs font-semibold text-primary">Income by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-1">
            {incomeDonutData.length === 0 ? (
              <EmptyState title="No income this month" />
            ) : (
              <div className="space-y-3">
                <svg style={{ width: 0, height: 0, position: "absolute" }}>
                  <defs>
                    {incomeDonutData.map((_, index) => (
                      <linearGradient
                        key={index}
                        id={`incomeDonutGrad${index}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor={INCOME_GRADIENTS[index % INCOME_GRADIENTS.length].start}
                        />
                        <stop
                          offset="100%"
                          stopColor={INCOME_GRADIENTS[index % INCOME_GRADIENTS.length].end}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                </svg>
                <div style={{ width: "100%", height: 144 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={100}>
                    <PieChart>
                      <Pie
                        data={incomeDonutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={58}
                        innerRadius={38}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {incomeDonutData.map((entry, index) => (
                          <Cell key={entry.name} fill={`url(#incomeDonutGrad${index})`} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="glass p-2 rounded-lg text-xs shadow-2xl border border-border">
                                <p className="font-semibold text-primary mb-0.5">{data.name}</p>
                                <p className="text-emerald-400 font-bold">
                                  {formatBDT(data.value)}
                                </p>
                                <p className="text-[10px] text-muted">
                                  {totalEarned > 0
                                    ? `${Math.round((data.value / totalEarned) * 100)}% of income`
                                    : "0%"}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 max-h-[90px] overflow-y-auto pr-1 scrollbar-thin">
                  {incomeDonutData.map((item, index) => {
                    const percent =
                      totalEarned > 0 ? Math.round((item.value / totalEarned) * 100) : 0;
                    return (
                      <div
                        key={item.name}
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
                          <span className="text-muted truncate">{item.name}</span>
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

        {/* Expense by Category Card */}
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
                <div style={{ width: "100%", height: 144 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={100}>
                    <BarChart
                      data={expenseBarData}
                      layout="vertical"
                      margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                      barSize={14}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        width={75}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.03)" }}
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="glass p-2 rounded-lg text-xs shadow-2xl border border-border">
                                <p className="font-semibold text-primary mb-0.5">{data.name}</p>
                                <p className="text-amber-400 font-bold">{formatBDT(data.value)}</p>
                                <p className="text-[10px] text-muted">
                                  {data.percent}% of expenses
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="value"
                        radius={[0, 4, 4, 0]}
                        background={{ fill: "rgba(31, 41, 55, 0.3)" }}
                      >
                        {expenseBarData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={EXPENSE_BAR_SHADES[index % EXPENSE_BAR_SHADES.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 max-h-[90px] overflow-y-auto pr-1 scrollbar-thin">
                  {expenseBarData.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-[11px] px-1 py-0.5 rounded hover:bg-card-hover"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: EXPENSE_BAR_SHADES[index % EXPENSE_BAR_SHADES.length],
                          }}
                        />
                        <span className="text-muted truncate">{item.name}</span>
                      </div>
                      <span className="font-semibold text-amber-400 shrink-0 ml-2">
                        {formatBDT(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
