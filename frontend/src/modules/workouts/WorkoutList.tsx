import type { NewWorkoutInput, Workout } from "@lifeos/contracts";
import { Plus as PlusIcon } from "lucide-react";
import { useState } from "react";
import Badge from "../../components/ui/Badge.js";
import Button from "../../components/ui/Button.js";
import Card, { CardContent } from "../../components/ui/Card.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { Input } from "../../components/ui/Input.js";
import { useWorkouts } from "./useWorkouts.js";

interface WorkoutListProps {
  onSelectWorkout?: (workout: Workout) => void;
  onStartSession?: (workout: Workout) => void;
}

export function WorkoutList({ onSelectWorkout, onStartSession }: WorkoutListProps) {
  const { workouts, loading, error, createWorkout, deleteWorkout } = useWorkouts();
  const [isCreating, setIsCreating] = useState(false);
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null);
  const [newWorkout, setNewWorkout] = useState<NewWorkoutInput>({
    name: "",
    description: "",
  });

  const handleCreate = async () => {
    if (!newWorkout.name.trim()) return;

    try {
      await createWorkout(newWorkout);
      setNewWorkout({ name: "", description: "" });
      setIsCreating(false);
    } catch (err) {
      console.error("Failed to create workout:", err);
    }
  };

  const handleDelete = async () => {
    if (deletingWorkoutId) {
      try {
        await deleteWorkout(deletingWorkoutId);
      } catch (err) {
        console.error("Failed to delete workout:", err);
      } finally {
        setDeletingWorkoutId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-card rounded-xl" />
        <div className="h-20 bg-card rounded-xl" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-500/10 text-red-400 rounded-lg">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-primary">Workouts</h2>
        <Button onClick={() => setIsCreating(true)} variant="primary">
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Workout
        </Button>
      </div>

      {isCreating && (
        <Card className="bg-surface-elevated border-border">
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Workout Name</label>
              <Input
                type="text"
                placeholder="e.g. Upper Body Hypertrophy"
                value={newWorkout.name}
                onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Description (optional)
              </label>
              <Input
                type="text"
                placeholder="Brief description"
                value={newWorkout.description || ""}
                onChange={(e) => setNewWorkout({ ...newWorkout, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={handleCreate}>
                Save Workout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {workouts.length === 0 ? (
        <Card className="bg-transparent border-dashed">
          <CardContent className="py-12 text-center text-muted">
            No workouts yet. Create your first workout plan!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <Card
              key={workout.id}
              className="hover:border-border-subtle transition-colors bg-card-solid/20 cursor-pointer"
              onClick={() => onSelectWorkout?.(workout)}
            >
              <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-primary">{workout.name}</h3>
                  {workout.description && (
                    <p className="text-sm text-secondary mt-1">{workout.description}</p>
                  )}
                  {workout.scheduledDay && (
                    <div className="mt-2">
                      <Badge variant="blue" className="bg-blue-900/30 text-blue-400">
                        Scheduled:{" "}
                        {workout.scheduledDay.charAt(0).toUpperCase() +
                          workout.scheduledDay.slice(1)}
                        {workout.scheduledTime && ` at ${workout.scheduledTime}`}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartSession?.(workout);
                    }}
                  >
                    Start Session
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingWorkoutId(workout.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deletingWorkoutId}
        title="Delete Workout"
        message="Are you sure you want to delete this workout? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingWorkoutId(null)}
        variant="danger"
      />
    </div>
  );
}
