import type { DashboardWorkoutDay } from "@lifeos/contracts";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardPanel } from "../components/DashboardPanel.js";

interface WorkoutChartWidgetProps {
  data: DashboardWorkoutDay[];
  labels: string[];
}

const COLOR_PALETTE = ["#f59e0b", "#818cf8", "#34d399", "#fb7185", "#38bdf8"];

export function WorkoutChartWidget({ data, labels }: WorkoutChartWidgetProps) {
  const displayLabels = labels.slice(0, 4);

  return (
    <DashboardPanel title="Workout" subtitle="this week, min">
      <div className="h-full w-full -ml-3 min-h-[160px]">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted">
            No workouts this week
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={{ stroke: "var(--color-border)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={22}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 6,
                  fontSize: 10,
                  padding: "4px 8px",
                }}
                labelStyle={{ color: "#d4d4d8" }}
              />
              {displayLabels.length > 0 ? (
                displayLabels.map((name, i) => (
                  <Bar
                    key={name}
                    dataKey={name}
                    stackId="w"
                    fill={COLOR_PALETTE[i % COLOR_PALETTE.length]}
                    radius={i === displayLabels.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                  />
                ))
              ) : (
                <Bar dataKey="Workout" stackId="w" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </DashboardPanel>
  );
}
