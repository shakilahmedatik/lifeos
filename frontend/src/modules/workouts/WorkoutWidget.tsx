import { Dumbbell as DumbbellIcon } from "lucide-react";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Skeleton } from "../../components/ui/Skeleton.js";
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DumbbellIcon className="w-5 h-5 text-muted" />
            Workouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  const upcomingWorkouts = workouts.filter((w) => w.scheduledDay);
  const recentSessions = sessions.slice(0, 3);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <DumbbellIcon className="w-5 h-5 text-emerald-500" />
          Workouts
        </CardTitle>
        {onViewHistory && (
          <button
            type="button"
            onClick={onViewHistory}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            History &rarr;
          </button>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {stats && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-surface-elevated p-3 rounded-lg border border-border text-center">
              <p className="text-2xl font-bold text-emerald-400">{stats.totalWorkouts}</p>
              <p className="text-xs text-secondary uppercase tracking-wider mt-1">Workouts</p>
            </div>
            <div className="bg-surface-elevated p-3 rounded-lg border border-border text-center">
              <p className="text-2xl font-bold text-blue-400">
                {Math.round(stats.averageDuration / 60)}
                <span className="text-sm font-normal text-muted">m</span>
              </p>
              <p className="text-xs text-secondary uppercase tracking-wider mt-1">Avg Time</p>
            </div>
          </div>
        )}

        <div className="space-y-4 flex-1">
          {upcomingWorkouts.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Upcoming
              </h4>
              <div className="space-y-2">
                {upcomingWorkouts.slice(0, 2).map((workout) => (
                  <button
                    type="button"
                    key={workout.id}
                    className="flex justify-between items-center p-2.5 bg-surface-elevated border border-border rounded-lg hover:bg-card-hover hover:border-border-subtle transition-all w-full text-left group"
                    onClick={() => onSelectWorkout?.(workout.id)}
                  >
                    <span className="text-sm font-medium text-primary group-hover:text-white transition-colors">
                      {workout.name}
                    </span>
                    <span className="text-xs text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded capitalize">
                      {workout.scheduledDay}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {recentSessions.length > 0 && (
            <div className={upcomingWorkouts.length > 0 ? "pt-2" : ""}>
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Recent Sessions
              </h4>
              <div className="space-y-2">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex justify-between items-center p-2.5 bg-surface-elevated border border-border rounded-lg"
                  >
                    <span className="text-sm text-primary">
                      {new Date(session.startedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-xs text-secondary">
                      {session.durationSeconds ? (
                        `${Math.round(session.durationSeconds / 60)}m`
                      ) : (
                        <span className="text-emerald-400 animate-pulse">In Progress</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcomingWorkouts.length === 0 && recentSessions.length === 0 && (
            <EmptyState
              title="No workout data yet."
              className="py-4"
              action={
                onSelectWorkout && (
                  <button
                    type="button"
                    onClick={() => onSelectWorkout("new")}
                    className="text-sm font-medium text-blue-400 hover:text-blue-300"
                  >
                    Start a workout
                  </button>
                )
              }
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
