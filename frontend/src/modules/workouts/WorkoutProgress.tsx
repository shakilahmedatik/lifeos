import Card, { CardContent } from "../../components/ui/Card.js";
import { useWorkoutSessions, useWorkoutStats } from "./useWorkouts.js";

interface WorkoutProgressProps {
  workoutId?: string;
}

export function WorkoutProgress({ workoutId }: WorkoutProgressProps) {
  const { loading: statsLoading } = useWorkoutStats();
  const { sessions, loading: sessionsLoading } = useWorkoutSessions();

  if (statsLoading || sessionsLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-gray-800/60 rounded-xl" />
        <div className="h-40 bg-gray-800/60 rounded-xl" />
      </div>
    );
  }

  const filteredSessions = workoutId ? sessions.filter((s) => s.workoutId === workoutId) : sessions;
  const completedSessions = filteredSessions.filter((s) => s.completedAt);
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

  const maxSessionsPerDay = Math.max(...sessionsPerDay, 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/40 border-gray-700/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total Workouts</p>
            <p className="text-2xl font-bold text-emerald-400">{completedSessions.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/40 border-gray-700/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total Time</p>
            <p className="text-2xl font-bold text-blue-400">
              {Math.round(totalDuration / 60)}{" "}
              <span className="text-sm font-normal text-gray-500">min</span>
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/40 border-gray-700/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Avg Duration</p>
            <p className="text-2xl font-bold text-purple-400">
              {Math.round(avgDuration / 60)}{" "}
              <span className="text-sm font-normal text-gray-500">min</span>
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/40 border-gray-700/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">This Week</p>
            <p className="text-2xl font-bold text-amber-400">
              {sessionsPerDay.reduce((a, b) => a + b, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800/40 border-gray-700/50">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-6 uppercase tracking-wider">
            Last 7 Days Activity
          </h4>
          <div className="flex items-end gap-2 h-40">
            {sessionsPerDay.map((count, index) => (
              <div
                key={last7Days[index]}
                className="flex-1 rounded-t-lg bg-linear-to-t from-blue-600 to-blue-400 transition-all duration-500 ease-out hover:brightness-110 relative group"
                style={{
                  height: `${Math.max((count / maxSessionsPerDay) * 100, count === 0 ? 5 : 10)}%`,
                }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-xs px-2 py-1 rounded text-white whitespace-nowrap z-10 pointer-events-none">
                  {count} {count === 1 ? "session" : "sessions"}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            {last7Days.map((date) => (
              <div
                key={date}
                className="flex-1 text-center text-xs text-gray-500 uppercase tracking-wider font-medium"
              >
                {new Date(date).toLocaleDateString("en", { weekday: "short" })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
