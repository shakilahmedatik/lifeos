import type { ExerciseLog } from "@lifeos/contracts";
import { useMemo, useState } from "react";
import Badge from "../../components/ui/Badge.js";
import Button from "../../components/ui/Button.js";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { TrashIcon } from "../../components/ui/icons.js";
import { deleteSession } from "./api.js";
import { useExercises, useWorkoutSession } from "./useWorkouts.js";

interface WorkoutSessionDetailProps {
  sessionId: string;
  onBack?: () => void;
  onDeleted?: () => void;
}

export function WorkoutSessionDetail({ sessionId, onBack, onDeleted }: WorkoutSessionDetailProps) {
  const { session, loading, error } = useWorkoutSession(sessionId);
  const { exercises } = useExercises();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteSession(sessionId);
      if (onDeleted) onDeleted();
      else if (onBack) onBack();
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  // Group logs by exercise ID
  const groupedLogs = useMemo(() => {
    if (!session?.logs) return [];

    const groups = new Map<string, { exerciseId: string; logs: ExerciseLog[] }>();

    session.logs.forEach((log) => {
      if (!groups.has(log.exerciseId)) {
        groups.set(log.exerciseId, {
          exerciseId: log.exerciseId,
          logs: [],
        });
      }
      groups.get(log.exerciseId)?.logs.push(log);
    });

    // Sort logs within groups by setNumber
    groups.forEach((group) => {
      group.logs.sort((a, b) => a.setNumber - b.setNumber);
    });

    return Array.from(groups.values());
  }, [session]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-gray-800/60 rounded-xl" />
        <div className="h-64 bg-gray-800/60 rounded-xl" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-4 bg-red-500/10 text-red-400 rounded-lg">
        Error: {error || "Session not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={() => setConfirmDelete(true)}
          variant="secondary"
          size="sm"
          className="text-red-400 hover:bg-red-900/20 hover:text-red-300 border-red-900/30"
        >
          <TrashIcon className="w-4 h-4 mr-2" />
          Delete Session
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/40 border-gray-700/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Started</p>
            <p className="font-medium text-gray-200">
              {new Date(session.startedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(session.startedAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/40 border-gray-700/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Duration</p>
            <p className="font-medium text-gray-200">
              {session.durationSeconds ? (
                `${Math.round(session.durationSeconds / 60)} min`
              ) : (
                <span className="text-emerald-400 animate-pulse">In Progress</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/40 border-gray-700/50">
          <CardContent className="p-4 text-center flex flex-col justify-center items-center h-full">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Status</p>
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
          </CardContent>
        </Card>

        {session.completedAt && (
          <Card className="bg-gray-800/40 border-gray-700/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Completed</p>
              <p className="font-medium text-gray-200">
                {new Date(session.completedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(session.completedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {session.notes && (
        <Card className="bg-gray-800/40 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg text-gray-300">Session Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 whitespace-pre-wrap">{session.notes}</p>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-200">Exercise Logs</h3>
        {groupedLogs.length === 0 ? (
          <Card className="bg-transparent border-dashed">
            <CardContent className="py-12 text-center text-gray-500">
              No exercise logs recorded.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groupedLogs.map((group) => {
              const exerciseName =
                exercises.find((e) => e.id === group.exerciseId)?.name || "Unknown Exercise";
              return (
                <Card key={group.exerciseId} className="bg-gray-800/20 border-gray-700/50">
                  <CardHeader className="pb-3 border-b border-gray-700/30">
                    <CardTitle className="text-md text-emerald-400">{exerciseName}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="space-y-2">
                      {group.logs.map((log) => (
                        <div
                          key={log.id}
                          className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider w-12">
                              Set {log.setNumber}
                            </span>
                            <span className="text-gray-200 font-medium">
                              {log.actualReps}{" "}
                              <span className="text-sm font-normal text-gray-400">reps</span>
                              {log.actualWeight ? (
                                <span className="ml-2">
                                  @ {log.actualWeight}{" "}
                                  <span className="text-sm font-normal text-gray-400">kg</span>
                                </span>
                              ) : null}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(log.completedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Session"
        message="Are you sure you want to delete this workout session? All logged exercises will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        variant="danger"
      />
    </div>
  );
}
