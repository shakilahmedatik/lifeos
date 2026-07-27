import { useState } from "react";

import type { NewWorkoutInput, Workout } from "@lifeos/contracts";
import { useWorkouts } from "./useWorkouts.js";

interface WorkoutListProps {
  onSelectWorkout?: (workout: Workout) => void;
  onStartSession?: (workout: Workout) => void;
}

export function WorkoutList({ onSelectWorkout, onStartSession }: WorkoutListProps) {
  const { workouts, loading, error, createWorkout, deleteWorkout } = useWorkouts();
  const [isCreating, setIsCreating] = useState(false);
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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this workout?")) {
      await deleteWorkout(id);
    }
  };

  if (loading) {
    return <div className="p-4">Loading workouts...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Workouts</h2>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Workout
        </button>
      </div>

      {isCreating && (
        <div className="mb-4 p-4 border rounded">
          <input
            type="text"
            placeholder="Workout name"
            value={newWorkout.name}
            onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })}
            className="w-full p-2 border rounded mb-2"
          />
          <textarea
            placeholder="Description (optional)"
            value={newWorkout.description}
            onChange={(e) => setNewWorkout({ ...newWorkout, description: e.target.value })}
            className="w-full p-2 border rounded mb-2"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {workouts.length === 0 ? (
        <p className="text-gray-500">No workouts yet. Create your first workout!</p>
      ) : (
        <div className="space-y-2">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              // biome-ignore lint/a11y/useSemanticElements: outer element cannot be button because child action buttons exist
              role="button"
              tabIndex={0}
              className="p-4 border rounded hover:bg-gray-50 w-full text-left cursor-pointer"
              onClick={() => onSelectWorkout?.(workout)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onSelectWorkout?.(workout);
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{workout.name}</h3>
                  {workout.description && (
                    <p className="text-sm text-gray-600">{workout.description}</p>
                  )}
                  {workout.scheduledDay && (
                    <p className="text-sm text-gray-500">
                      Scheduled: {workout.scheduledDay}
                      {workout.scheduledTime && ` at ${workout.scheduledTime}`}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartSession?.(workout);
                    }}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                  >
                    Start
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(workout.id);
                    }}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
