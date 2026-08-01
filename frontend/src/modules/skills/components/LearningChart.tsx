import { SimpleBarChart } from "../../../components/ui/charts/SimpleBarChart.js";
import type { LearningLog } from "../types.js";

interface LearningChartProps {
  logs: LearningLog[];
}

export function LearningChart({ logs }: LearningChartProps) {
  const dataMap = new Map<string, number>();

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
    label: date,
    value: minutes,
  }));

  return (
    <div className="w-full mt-4">
      <SimpleBarChart data={data} height={256} formatValue={(v) => `${v} mins`} />
    </div>
  );
}
