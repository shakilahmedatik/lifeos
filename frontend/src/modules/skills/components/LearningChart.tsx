import { motion } from "motion/react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LearningLog } from "../types.js";

interface LearningChartProps {
  logs: LearningLog[];
}

export function LearningChart({ logs }: LearningChartProps) {
  // Aggregate logs by date
  const dataMap = new Map<string, number>();

  // Initialize last 7 days with 0
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dataMap.set(key, 0);
  }

  logs.forEach((log) => {
    const d = new Date(log.date);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (dataMap.has(key)) {
      dataMap.set(key, (dataMap.get(key) ?? 0) + log.minutesSpent);
    }
  });

  const data = Array.from(dataMap.entries()).map(([date, minutes]) => ({
    date,
    minutes,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-64 mt-4"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--color-muted)" }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--color-muted)" }}
            dx={-10}
          />
          <Tooltip
            cursor={{ fill: "var(--color-card-hover)", opacity: 0.4 }}
            content={({ active, payload }) => {
              if (active && payload?.length) {
                return (
                  <div className="glass p-2 rounded-lg text-xs shadow-lg">
                    <div className="font-semibold text-primary">{payload[0].payload.date}</div>
                    <div className="text-accent">{payload[0].value} mins</div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="minutes" fill="var(--color-accent)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
