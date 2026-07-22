import { useWorkoutSession } from "./useWorkouts.js";

interface WorkoutSessionDetailProps {
  sessionId: string;
  onBack?: () => void;
}

export function WorkoutSessionDetail({ sessionId, onBack }: WorkoutSessionDetailProps) {
  const { session, loading, error } = useWorkoutSession(sessionId);

  if (loading) {
    return <div className="p-4">Loading session...</div>;
  }

  if (error || !session) {
    return <div className="p-4 text-red-500">Error: {error || "Session not found"}</div>;
  }

  return (
    <div className="p-4">
      <button type="button" onClick={onBack} className="text-blue-500 hover:text-blue-600 mb-4">
        &larr; Back
      </button>

      <h2 className="text-2xl font-bold mb-4">Workout Session</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Started</p>
          <p className="font-medium">{new Date(session.startedAt).toLocaleString()}</p>
        </div>
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Duration</p>
          <p className="font-medium">
            {session.durationSeconds
              ? `${Math.round(session.durationSeconds / 60)} minutes`
              : "In Progress"}
          </p>
        </div>
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Status</p>
          <p
            className={`font-medium ${session.completedAt ? "text-green-500" : "text-yellow-500"}`}
          >
            {session.completedAt ? "Completed" : "In Progress"}
          </p>
        </div>
        {session.completedAt && (
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="font-medium">{new Date(session.completedAt).toLocaleString()}</p>
          </div>
        )}
      </div>

      {session.notes && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Notes</h3>
          <p className="text-gray-600">{session.notes}</p>
        </div>
      )}

      <h3 className="text-lg font-semibold mb-2">Exercise Logs</h3>
      {session.logs.length === 0 ? (
        <p className="text-gray-500">No exercise logs recorded.</p>
      ) : (
        <div className="space-y-2">
          {session.logs.map((log) => (
            <div key={log.id} className="p-3 border rounded">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Exercise {log.exerciseId}</p>
                  <p className="text-sm text-gray-600">
                    Set {log.setNumber}: {log.actualReps} reps
                    {log.actualWeight && ` @ ${log.actualWeight} kg`}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(log.completedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
