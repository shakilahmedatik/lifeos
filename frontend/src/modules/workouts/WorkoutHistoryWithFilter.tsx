import { useMemo, useState } from "react";
import { useWorkoutSessions, useWorkouts } from "./useWorkouts.js";

interface WorkoutHistoryWithFilterProps {
  onSelectSession?: (sessionId: string) => void;
}

export function WorkoutHistoryWithFilter({ onSelectSession }: WorkoutHistoryWithFilterProps) {
  const { sessions, loading: sessionsLoading, error: sessionsError } = useWorkoutSessions();
  const { workouts, loading: workoutsLoading } = useWorkouts();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "duration">("date");

  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((session) => {
        const workout = workouts.find((w) => w.id === session.workoutId);
        return (
          workout?.name.toLowerCase().includes(query) ||
          session.notes?.toLowerCase().includes(query)
        );
      });
    }

    if (selectedWorkoutId) {
      result = result.filter((session) => session.workoutId === selectedWorkoutId);
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter).toISOString().split("T")[0];
      result = result.filter((session) => session.startedAt.startsWith(filterDate));
    }

    result.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
      }
      return (b.durationSeconds || 0) - (a.durationSeconds || 0);
    });

    return result;
  }, [sessions, workouts, searchQuery, selectedWorkoutId, dateFilter, sortBy]);

  if (sessionsLoading || workoutsLoading) {
    return <div className="p-4">Loading history...</div>;
  }

  if (sessionsError) {
    return <div className="p-4 text-red-500">Error: {sessionsError}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Workout History</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label htmlFor="search" className="block text-sm text-gray-600 mb-1">
            Search
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search workouts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="workout-filter" className="block text-sm text-gray-600 mb-1">
            Workout
          </label>
          <select
            id="workout-filter"
            value={selectedWorkoutId}
            onChange={(e) => setSelectedWorkoutId(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">All Workouts</option>
            {workouts.map((workout) => (
              <option key={workout.id} value={workout.id}>
                {workout.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date-filter" className="block text-sm text-gray-600 mb-1">
            Date
          </label>
          <input
            id="date-filter"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="sort-by" className="block text-sm text-gray-600 mb-1">
            Sort By
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "duration")}
            className="w-full p-2 border rounded"
          >
            <option value="date">Date (Newest)</option>
            <option value="duration">Duration (Longest)</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {filteredSessions.length} session{filteredSessions.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {filteredSessions.length === 0 ? (
        <p className="text-gray-500">No sessions match your filters.</p>
      ) : (
        <div className="space-y-2">
          {filteredSessions.map((session) => {
            const workout = workouts.find((w) => w.id === session.workoutId);
            return (
              <button
                type="button"
                key={session.id}
                className="p-4 border rounded hover:bg-gray-50 w-full text-left"
                onClick={() => onSelectSession?.(session.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{workout?.name || "Unknown Workout"}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(session.startedAt).toLocaleString()}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
