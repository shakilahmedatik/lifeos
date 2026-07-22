import { useState } from "react";

import type { NewWorkoutExerciseInput } from "../../../../packages/contracts/src/index.js";
import { addExerciseToWorkout, removeExerciseFromWorkout, updateWorkoutExercise } from "./api.js";
import { useExercises, useWorkout } from "./useWorkouts.js";

interface WorkoutDetailProps {
  workoutId: string;
  onBack?: () => void;
  onStartSession?: () => void;
}

export function WorkoutDetail({ workoutId, onBack, onStartSession }: WorkoutDetailProps) {
  const { workout, loading, error, refresh } = useWorkout(workoutId);
  const { exercises } = useExercises();
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [exerciseConfig, setExerciseConfig] = useState<NewWorkoutExerciseInput>({
    sets: 3,
    reps: 10,
    restSeconds: 60,
  });

  const handleAddExercise = async () => {
    if (!selectedExerciseId) return;

    try {
      await addExerciseToWorkout(workoutId, selectedExerciseId, exerciseConfig);
      setSelectedExerciseId("");
      setExerciseConfig({ sets: 3, reps: 10, restSeconds: 60 });
      setIsAddingExercise(false);
      refresh();
    } catch (err) {
      console.error("Failed to add exercise:", err);
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    if (confirm("Remove this exercise from the workout?")) {
      await removeExerciseFromWorkout(workoutId, exerciseId);
      refresh();
    }
  };

  const handleUpdateExercise = async (
    exerciseId: string,
    patch: Partial<NewWorkoutExerciseInput>,
  ) => {
    await updateWorkoutExercise(workoutId, exerciseId, patch);
    refresh();
  };

  if (loading) {
    return <div className="p-4">Loading workout...</div>;
  }

  if (error || !workout) {
    return <div className="p-4 text-red-500">Error: {error || "Workout not found"}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={onBack} className="text-blue-500 hover:text-blue-600">
          &larr; Back
        </button>
        <button
          type="button"
          onClick={onStartSession}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Start Session
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-2">{workout.name}</h2>
      {workout.description && <p className="text-gray-600 mb-4">{workout.description}</p>}
      {workout.scheduledDay && (
        <p className="text-sm text-gray-500 mb-4">
          Scheduled: {workout.scheduledDay}
          {workout.scheduledTime && ` at ${workout.scheduledTime}`}
        </p>
      )}

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Exercises</h3>
          <button
            type="button"
            onClick={() => setIsAddingExercise(true)}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Add Exercise
          </button>
        </div>

        {isAddingExercise && (
          <div className="mb-4 p-4 border rounded">
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            >
              <option value="">Select an exercise</option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name} ({exercise.muscleGroup})
                </option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <label htmlFor="sets" className="block text-sm text-gray-600">
                  Sets
                </label>
                <input
                  id="sets"
                  type="number"
                  value={exerciseConfig.sets}
                  onChange={(e) =>
                    setExerciseConfig({ ...exerciseConfig, sets: Number(e.target.value) })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label htmlFor="reps" className="block text-sm text-gray-600">
                  Reps
                </label>
                <input
                  id="reps"
                  type="number"
                  value={exerciseConfig.reps}
                  onChange={(e) =>
                    setExerciseConfig({ ...exerciseConfig, reps: Number(e.target.value) })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label htmlFor="rest" className="block text-sm text-gray-600">
                  Rest (sec)
                </label>
                <input
                  id="rest"
                  type="number"
                  value={exerciseConfig.restSeconds}
                  onChange={(e) =>
                    setExerciseConfig({ ...exerciseConfig, restSeconds: Number(e.target.value) })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddExercise}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingExercise(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {workout.exercises.length === 0 ? (
          <p className="text-gray-500">No exercises added yet.</p>
        ) : (
          <div className="space-y-2">
            {workout.exercises.map((we) => {
              const exercise = exercises.find((e) => e.id === we.exerciseId);
              return (
                <div key={we.id} className="p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{exercise?.name || "Unknown Exercise"}</p>
                      <p className="text-sm text-gray-600">
                        {we.sets} sets &times; {we.reps} reps
                        {we.weight && ` @ ${we.weight} kg`}
                        {` | ${we.restSeconds}s rest`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateExercise(we.id, { sets: we.sets + 1 })}
                        className="px-2 py-1 bg-gray-200 rounded text-sm"
                      >
                        +1 Set
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(we.id)}
                        className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
