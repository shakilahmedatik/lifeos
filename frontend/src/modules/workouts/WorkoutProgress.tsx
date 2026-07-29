import { Activity, CalendarDays, ChevronRight, Clock, Dumbbell, Target, Zap } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Button from "../../components/ui/Button.js";
import Card, { CardContent } from "../../components/ui/Card.js";
import { StatCard } from "../../components/ui/StatCard.js";
import { useWorkoutSessions, useWorkoutStats, useWorkouts } from "./useWorkouts.js";

interface WorkoutProgressProps {
  workoutId?: string;
  onViewHistory?: () => void;
  onViewSession?: (id: string) => void;
}

export function WorkoutProgress({ workoutId, onViewHistory, onViewSession }: WorkoutProgressProps) {
  const { loading: statsLoading } = useWorkoutStats();
  const { sessions, loading: sessionsLoading } = useWorkoutSessions();
  const { workouts, loading: workoutsLoading } = useWorkouts();

  if (statsLoading || sessionsLoading || workoutsLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-card-hover rounded-xl" />
        <div className="h-40 bg-card-hover rounded-xl" />
      </div>
    );
  }

  const filteredSessions = workoutId ? sessions.filter((s) => s.workoutId === workoutId) : sessions;
  const completedSessions = filteredSessions
    .filter((s) => s.completedAt)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const totalDuration = completedSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const avgDuration = completedSessions.length > 0 ? totalDuration / completedSessions.length : 0;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split("T")[0];
  }).reverse();

  const sessionsPerDay = last7Days.map((date) => {
    return completedSessions.filter((s) => s.startedAt.startsWith(date)).length;
  });

  const chartData = last7Days.map((date, index) => ({
    date: new Date(date).toLocaleDateString("en", { weekday: "short" }),
    fullDate: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    sessions: sessionsPerDay[index],
  }));

  const thisWeekTotal = sessionsPerDay.reduce((a, b) => a + b, 0);
  const weeklyGoal = 4;
  const goalProgress = Math.min(thisWeekTotal / weeklyGoal, 1);
  const circleRadius = 40;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - goalProgress * circleCircumference;

  const recentSessions = completedSessions.slice(0, 2);

  return (
    <div className="space-y-4">
      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Workouts" value={completedSessions.length} icon={Dumbbell} />
        <StatCard
          label="Total Time"
          value={Math.round(totalDuration / 60)}
          icon={Clock}
          format={(n) => `${n} min`}
        />
        <StatCard
          label="Avg Duration"
          value={Math.round(avgDuration / 60)}
          icon={Activity}
          format={(n) => `${n} min`}
        />
        <StatCard label="This Week" value={thisWeekTotal} icon={Zap} />
      </div>

      {/* Row 2: Recent History & Weekly Goal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 flex flex-col h-full">
          <div className="flex items-center justify-between p-3 border-b border-border/50">
            <h4 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-accent" />
              Recent History
            </h4>
            {onViewHistory && (
              <Button variant="ghost" className="h-8 text-xs px-2" onClick={onViewHistory}>
                View All <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
          <CardContent className="p-0 flex-1 flex flex-col">
            {recentSessions.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm flex-1 flex items-center justify-center">
                No recent workouts found.
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {recentSessions.map((session) => {
                  const w = workouts.find((x) => x.id === session.workoutId);
                  return (
                    <div
                      key={session.id}
                      className="p-2.5 px-3 flex items-center justify-between hover:bg-card-hover transition-colors cursor-pointer"
                      onClick={() => onViewSession?.(session.id)}
                    >
                      <div>
                        <p className="font-semibold text-primary text-xs">
                          {w?.name || "Unknown Workout"}
                        </p>
                        <p className="text-[11px] text-muted mt-0.5">
                          {new Date(session.startedAt).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-accent">
                          {Math.round((session.durationSeconds || 0) / 60)} min
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center p-4 text-center h-full">
          <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider w-full flex items-center justify-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            Weekly Goal
          </h4>

          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                className="text-border"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r={circleRadius}
                cx="48"
                cy="48"
              />
              <circle
                className="text-accent transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={circleRadius}
                cx="48"
                cy="48"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-primary tabular-nums tracking-tighter">
                {thisWeekTotal}
              </span>
              <span className="text-[10px] text-muted uppercase tracking-widest font-medium mt-0.5">
                / {weeklyGoal}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-muted mt-3 max-w-45">
            {thisWeekTotal >= weeklyGoal
              ? "Goal reached! Amazing work this week."
              : `${weeklyGoal - thisWeekTotal} more ${weeklyGoal - thisWeekTotal === 1 ? "workout" : "workouts"} to reach your goal.`}
          </p>
        </Card>
      </div>

      {/* Row 3: Activity Chart */}
      <Card className="w-full">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">
            Last 7 Days Activity
          </h4>
          <div className="w-full h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  allowDecimals={false}
                />
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <Tooltip
                  cursor={{ fill: "var(--color-card-hover)", opacity: 0.4 }}
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="glass p-2 rounded-lg text-xs shadow-lg border border-border/50">
                          <div className="font-semibold text-primary mb-1">
                            {payload[0].payload.fullDate}
                          </div>
                          <div className="text-accent font-medium">
                            {payload[0].value} {payload[0].value === 1 ? "session" : "sessions"}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="sessions"
                  fill="var(--color-accent)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
