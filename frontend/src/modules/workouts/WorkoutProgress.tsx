import { useWorkoutSessions, useWorkoutStats } from "./useWorkouts.js";

interface WorkoutProgressProps {
  workoutId?: string;
}

export function WorkoutProgress({ workoutId }: WorkoutProgressProps) {
  const { loading: statsLoading } = useWorkoutStats();
  const { sessions, loading: sessionsLoading } = useWorkoutSessions();

  if (statsLoading || sessionsLoading) {
    return <div className="p-4">Loading progress...</div>;
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
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Workout Progress</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Total Workouts</p>
          <p className="text-2xl font-bold">{completedSessions.length}</p>
        </div>
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Total Time</p>
          <p className="text-2xl font-bold">{Math.round(totalDuration / 60)} min</p>
        </div>
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Avg Duration</p>
          <p className="text-2xl font-bold">{Math.round(avgDuration / 60)} min</p>
        </div>
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">This Week</p>
          <p className="text-2xl font-bold">{sessionsPerDay.reduce((a, b) => a + b, 0)}</p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Last 7 Days</h4>
        <div className="flex items-end gap-1 h-32">
          {sessionsPerDay.map((count, index) => (
            <div
              key={last7Days[index]}
              className="flex-1 bg-blue-500 rounded-t"
              style={{ height: `${(count / maxSessionsPerDay) * 100}%` }}
              title={`${last7Days[index]}: ${count} sessions`}
            />
          ))}
        </div>
        <div className="flex gap-1 mt-1">
          {last7Days.map((date) => (
            <div key={date} className="flex-1 text-center text-xs text-gray-500">
              {new Date(date).toLocaleDateString("en", { weekday: "short" })}
            </div>
          ))}
        </div>
      </div>

      {completedSessions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">Recent Sessions</h4>
          <div className="space-y-2">
            {completedSessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <span className="text-sm">{new Date(session.startedAt).toLocaleDateString()}</span>
                <span className="text-sm text-gray-600">
                  {session.durationSeconds
                    ? `${Math.round(session.durationSeconds / 60)} min`
                    : "-"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
