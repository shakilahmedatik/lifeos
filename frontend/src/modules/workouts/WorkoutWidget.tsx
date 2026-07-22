import { useWorkoutSessions, useWorkoutStats, useWorkouts } from "./useWorkouts.js";

interface WorkoutWidgetProps {
  onSelectWorkout?: (workoutId: string) => void;
  onViewHistory?: () => void;
}

export function WorkoutWidget({ onSelectWorkout, onViewHistory }: WorkoutWidgetProps) {
  const { stats, loading: statsLoading } = useWorkoutStats();
  const { workouts, loading: workoutsLoading } = useWorkouts();
  const { sessions, loading: sessionsLoading } = useWorkoutSessions();

  if (statsLoading || workoutsLoading || sessionsLoading) {
    return (
      <div className="p-4 border rounded">
        <h3 className="text-lg font-semibold mb-2">Workouts</h3>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const upcomingWorkouts = workouts.filter((w) => w.scheduledDay);
  const recentSessions = sessions.slice(0, 3);

  return (
    <div className="p-4 border rounded">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Workouts</h3>
        <button
          type="button"
          onClick={onViewHistory}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          View History
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
            <p className="text-sm text-gray-600">Workouts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{Math.round(stats.averageDuration / 60)}m</p>
            <p className="text-sm text-gray-600">Avg Duration</p>
          </div>
        </div>
      )}

      {upcomingWorkouts.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Upcoming</h4>
          <div className="space-y-1">
            {upcomingWorkouts.slice(0, 3).map((workout) => (
              <button
                type="button"
                key={workout.id}
                className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 w-full text-left"
                onClick={() => onSelectWorkout?.(workout.id)}
              >
                <span className="text-sm">{workout.name}</span>
                <span className="text-xs text-gray-500">
                  {workout.scheduledDay}
                  {workout.scheduledTime && ` ${workout.scheduledTime}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {recentSessions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">Recent Sessions</h4>
          <div className="space-y-1">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <span className="text-sm">{new Date(session.startedAt).toLocaleDateString()}</span>
                <span className="text-xs text-gray-500">
                  {session.durationSeconds
                    ? `${Math.round(session.durationSeconds / 60)}m`
                    : "In Progress"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
