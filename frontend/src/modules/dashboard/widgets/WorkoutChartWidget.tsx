import type { DashboardWorkoutDay } from "@lifeos/contracts";
import { SimpleBarChart } from "../../../components/ui/charts/SimpleBarChart.js";
import { DashboardPanel } from "../components/DashboardPanel.js";

interface WorkoutChartWidgetProps {
  data: DashboardWorkoutDay[];
  labels: string[];
}

const COLOR_PALETTE = ["#f59e0b", "#818cf8", "#34d399", "#fb7185", "#38bdf8"];

export function WorkoutChartWidget({ data, labels }: WorkoutChartWidgetProps) {
  const displayLabels = labels.slice(0, 4);

  const chartData = data.map((d) => {
    let total = 0;
    for (const key of Object.keys(d)) {
      if (key !== "day" && typeof d[key] === "number") {
        total += d[key] as number;
      }
    }
    return {
      label: d.day,
      value: total,
      color: "var(--color-accent)",
    };
  });

  return (
    <DashboardPanel title="Workout" subtitle="this week, min">
      <div className="h-full w-full min-h-[160px]">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted">
            No workouts this week
          </div>
        ) : (
          <SimpleBarChart
            data={chartData}
            showYAxis={true}
            height={160}
            formatValue={(v) => `${v} min`}
            className="w-full"
          />
        )}
      </div>
    </DashboardPanel>
  );
}
