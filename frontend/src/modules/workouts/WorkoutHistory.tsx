import Badge from "../../components/ui/Badge.js";
import Card, { CardContent } from "../../components/ui/Card.js";
import { useWorkoutSessions, useWorkoutStats } from "./useWorkouts.js";

interface WorkoutHistoryProps {
  onSelectSession?: (sessionId: string) => void;
}

export function WorkoutHistory({ onSelectSession }: WorkoutHistoryProps) {
  const { sessions, loading: sessionsLoading, error: sessionsError } = useWorkoutSessions();
  const { stats, loading: statsLoading, error: statsError } = useWorkoutStats();

  if (sessionsLoading || statsLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-gray-800/60 rounded-xl" />
        <div className="h-64 bg-gray-800/60 rounded-xl" />
      </div>
    );
  }

  if (sessionsError || statsError) {
    return (
      <div className="p-4 bg-red-500/10 text-red-400 rounded-lg">
        Error: {sessionsError || statsError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800/40 border-gray-700/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total Workouts</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.totalWorkouts}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/40 border-gray-700/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total Sessions</p>
              <p className="text-2xl font-bold text-blue-400">{stats.totalSessions}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/40 border-gray-700/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total Time</p>
              <p className="text-2xl font-bold text-amber-400">
                {Math.round(stats.totalDuration / 60)}{" "}
                <span className="text-sm font-normal text-gray-500">min</span>
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/40 border-gray-700/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Avg Duration</p>
              <p className="text-2xl font-bold text-purple-400">
                {Math.round(stats.averageDuration / 60)}{" "}
                <span className="text-sm font-normal text-gray-500">min</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-200">Recent Sessions</h3>
        {sessions.length === 0 ? (
          <Card className="bg-transparent border-dashed">
            <CardContent className="py-12 text-center text-gray-500">
              No workout sessions yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <button
                type="button"
                key={session.id}
                className="w-full text-left"
                onClick={() => onSelectSession?.(session.id)}
              >
                <Card className="hover:border-gray-600 transition-colors bg-gray-800/20">
                  <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <p className="font-medium text-gray-200">Workout Session</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {new Date(session.startedAt).toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {session.durationSeconds && (
                        <p className="text-sm font-medium text-gray-300">
                          {Math.round(session.durationSeconds / 60)} min
                        </p>
                      )}
                      <Badge
                        variant={session.completedAt ? "success" : "warning"}
                        className={
                          session.completedAt
                            ? "bg-emerald-900/30 text-emerald-400"
                            : "bg-yellow-900/30 text-yellow-500"
                        }
                      >
                        {session.completedAt ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
