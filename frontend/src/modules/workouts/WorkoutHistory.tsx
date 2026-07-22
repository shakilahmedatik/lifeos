import { useWorkoutSessions, useWorkoutStats } from "./useWorkouts.js";

interface WorkoutHistoryProps {
  onSelectSession?: (sessionId: string) => void;
}

export function WorkoutHistory({ onSelectSession }: WorkoutHistoryProps) {
  const { sessions, loading: sessionsLoading, error: sessionsError } = useWorkoutSessions();
  const { stats, loading: statsLoading, error: statsError } = useWorkoutStats();

  if (sessionsLoading || statsLoading) {
    return <div className="p-4">Loading history...</div>;
  }

  if (sessionsError || statsError) {
    return <div className="p-4 text-red-500">Error: {sessionsError || statsError}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Workout History</h2>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-600">Total Workouts</p>
            <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
          </div>
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-600">Total Sessions</p>
            <p className="text-2xl font-bold">{stats.totalSessions}</p>
          </div>
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-600">Total Time</p>
            <p className="text-2xl font-bold">{Math.round(stats.totalDuration / 60)} min</p>
          </div>
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-600">Avg Duration</p>
            <p className="text-2xl font-bold">{Math.round(stats.averageDuration / 60)} min</p>
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold mb-2">Recent Sessions</h3>
      {sessions.length === 0 ? (
        <p className="text-gray-500">No workout sessions yet.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <button
              type="button"
              key={session.id}
              className="p-4 border rounded hover:bg-gray-50 w-full text-left"
              onClick={() => onSelectSession?.(session.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Workout Session</p>
                  <p className="text-sm text-gray-600">
                    {new Date(session.startedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  {session.durationSeconds && (
                    <p className="text-sm text-gray-600">
                      {Math.round(session.durationSeconds / 60)} min
                    </p>
                  )}
                  <p
                    className={`text-sm ${
                      session.completedAt ? "text-green-500" : "text-yellow-500"
                    }`}
                  >
                    {session.completedAt ? "Completed" : "In Progress"}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
