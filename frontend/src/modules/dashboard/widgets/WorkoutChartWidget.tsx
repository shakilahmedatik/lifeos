import type { DashboardWorkoutDay } from "@lifeos/contracts";
import { SimpleBarChart } from "../../../components/ui/charts/SimpleBarChart.js";
import EmptyState from "../../../components/ui/EmptyState.js";
import { DashboardPanel } from "../components/DashboardPanel.js";

interface WorkoutChartWidgetProps {
  data: DashboardWorkoutDay[];
  labels: string[];
}

export function WorkoutChartWidget({ data }: WorkoutChartWidgetProps) {
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
      <div className="h-full w-full overflow-hidden flex flex-col justify-center items-center">
        {data.length === 0 ? (
          <EmptyState title="No workouts this week" className="py-4" />
        ) : (
          <div className="w-full flex items-center justify-center">
            <SimpleBarChart
              data={chartData}
              showYAxis={true}
              height={145}
              formatValue={(v) => `${v} min`}
              className="w-full"
            />
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}
