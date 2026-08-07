import { Search as SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import Badge from "../../components/ui/Badge.js";
import Card, { CardContent } from "../../components/ui/Card.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import { useWorkoutSessions, useWorkouts } from "./useWorkouts.js";

interface WorkoutHistoryWithFilterProps {
  onSelectSession?: (sessionId: string) => void;
  onViewSession?: (sessionId: string) => void; // Added for Dashboard wiring compatibility
}

export function WorkoutHistoryWithFilter({
  onSelectSession,
  onViewSession,
}: WorkoutHistoryWithFilterProps) {
  const { sessions, loading: sessionsLoading, error: sessionsError } = useWorkoutSessions();
  const { workouts, loading: workoutsLoading } = useWorkouts();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "duration">("date");

  const handleSelect = (id: string) => {
    if (onSelectSession) onSelectSession(id);
    if (onViewSession) onViewSession(id);
  };

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
      result = result.filter((session) => {
        const d = new Date(session.startedAt);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const localSessionDate = `${year}-${month}-${day}`;
        return localSessionDate === dateFilter;
      });
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
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-card rounded-xl" />
        <div className="h-64 bg-card rounded-xl" />
      </div>
    );
  }

  if (sessionsError) {
    return <div className="p-4 bg-red-500/10 text-red-400 rounded-lg">Error: {sessionsError}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <label className="block text-xs uppercase tracking-wider text-muted mb-1">
            Search
          </label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted mb-1">
            Workout
          </label>
          <Select
            value={selectedWorkoutId}
            onChange={(e) => setSelectedWorkoutId(e.target.value)}
            options={[
              { value: "", label: "All Workouts" },
              ...workouts.map((w) => ({ value: w.id, label: w.name })),
            ]}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted mb-1">Date</label>
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted mb-1">
            Sort By
          </label>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "duration")}
            options={[
              { value: "date", label: "Date (Newest)" },
              { value: "duration", label: "Duration (Longest)" },
            ]}
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-primary">History</h3>
        <span className="text-sm text-muted">
          {filteredSessions.length} session{filteredSessions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filteredSessions.length === 0 ? (
        <Card className="bg-transparent border-dashed">
          <CardContent className="py-12 text-center text-muted">
            No sessions match your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const workout = workouts.find((w) => w.id === session.workoutId);
            return (
              <button
                type="button"
                key={session.id}
                className="w-full text-left"
                onClick={() => handleSelect(session.id)}
              >
                <Card className="hover:border-border-subtle transition-colors bg-card-solid/20">
                  <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="font-semibold text-primary">
                        {workout?.name || "Unknown Workout"}
                      </p>
                      <p className="text-sm text-secondary mt-1">
                        {new Date(session.startedAt).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {session.durationSeconds && (
                        <p className="text-sm font-medium text-primary">
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
            );
          })}
        </div>
      )}
    </div>
  );
}
