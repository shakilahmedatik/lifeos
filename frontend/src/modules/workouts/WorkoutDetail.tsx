import type { DayOfWeek, NewWorkoutExerciseInput, WorkoutExercise } from "@lifeos/contracts";
import { useState } from "react";
import Button from "../../components/ui/Button.js";
import Card, { CardContent } from "../../components/ui/Card.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { addExerciseToWorkout, removeExerciseFromWorkout, updateWorkoutExercise } from "./api.js";
import { ExerciseFormModal } from "./components/ExerciseFormModal.js";
import { WorkoutDetailHeader } from "./components/WorkoutDetailHeader.js";
import { WorkoutEditModal } from "./components/WorkoutEditModal.js";
import { WorkoutExerciseItem } from "./components/WorkoutExerciseItem.js";
import { useExercises, useWorkout } from "./useWorkouts.js";

interface WorkoutDetailProps {
  workoutId: string;
  onBack?: () => void;
  onStartSession?: () => void;
  onDeleted?: () => void;
}

export function WorkoutDetail({
  workoutId,
  onBack,
  onStartSession,
  onDeleted,
}: WorkoutDetailProps) {
  const { workout, loading, error, refresh, deleteWorkout, updateWorkout, reorderExercises } =
    useWorkout(workoutId);
  const { exercises } = useExercises();
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [confirmDeleteWorkout, setConfirmDeleteWorkout] = useState(false);
  const [isEditWorkoutModalOpen, setIsEditWorkoutModalOpen] = useState(false);
  const [editWorkoutName, setEditWorkoutName] = useState("");
  const [editWorkoutDesc, setEditWorkoutDesc] = useState("");
  const [editWorkoutDay, setEditWorkoutDay] = useState<DayOfWeek | "">("");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [exerciseConfig, setExerciseConfig] = useState<NewWorkoutExerciseInput>({
    sets: 3,
    reps: 10,
    restSeconds: 60,
    weights: [0, 0, 0],
    repsArray: [10, 10, 10],
  });

  const handleSubmitExercise = async () => {
    if (!selectedExerciseId) return;

    try {
      if (editingExerciseId) {
        await handleUpdateExercise(editingExerciseId, exerciseConfig);
      } else {
        await addExerciseToWorkout(workoutId, selectedExerciseId, exerciseConfig);
      }
      setSelectedExerciseId("");
      setEditingExerciseId(null);
      setExerciseConfig({
        sets: 3,
        reps: 10,
        restSeconds: 60,
        weights: [0, 0, 0],
        repsArray: [10, 10, 10],
      });
      setIsAddingExercise(false);
      refresh();
    } catch (err) {
      console.error("Failed to save exercise:", err);
    }
  };

  const handleRemoveExercise = async () => {
    if (confirmRemoveId) {
      try {
        await removeExerciseFromWorkout(workoutId, confirmRemoveId);
        refresh();
      } catch (err) {
        console.error("Failed to remove exercise:", err);
      } finally {
        setConfirmRemoveId(null);
      }
    }
  };

  const handleUpdateExercise = async (
    exerciseId: string,
    patch: Partial<NewWorkoutExerciseInput>,
  ) => {
    await updateWorkoutExercise(workoutId, exerciseId, patch);
    refresh();
  };

  const handleEditClick = (we: WorkoutExercise) => {
    setEditingExerciseId(we.id);
    setSelectedExerciseId(we.exerciseId);
    setExerciseConfig({
      sets: we.sets,
      reps: we.reps,
      restSeconds: we.restSeconds,
      weights: we.weights || Array(we.sets).fill(we.weight || 0),
      repsArray: we.repsArray || Array(we.sets).fill(we.reps || 10),
    });
    setIsAddingExercise(true);
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0 || !workout) return;
    const newOrder = [...workout.exercises];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    await reorderExercises(newOrder.map((e) => e.id));
  };

  const handleMoveDown = async (index: number) => {
    if (!workout || index === workout.exercises.length - 1) return;
    const newOrder = [...workout.exercises];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    await reorderExercises(newOrder.map((e) => e.id));
  };

  const handleDeleteWorkout = async () => {
    try {
      await deleteWorkout();
      if (onDeleted) onDeleted();
      else if (onBack) onBack();
    } catch (err) {
      console.error("Failed to delete workout:", err);
    } finally {
      setConfirmDeleteWorkout(false);
    }
  };

  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWorkoutName.trim()) return;
    try {
      await updateWorkout({
        name: editWorkoutName,
        description: editWorkoutDesc,
        scheduledDay: editWorkoutDay || undefined,
      });
      refresh();
    } catch (err) {
      console.error("Failed to save workout:", err);
    } finally {
      setIsEditWorkoutModalOpen(false);
    }
  };

  const openEditWorkout = () => {
    if (!workout) return;
    setEditWorkoutName(workout.name);
    setEditWorkoutDesc(workout.description || "");
    setEditWorkoutDay(workout.scheduledDay || "");
    setIsEditWorkoutModalOpen(true);
  };

  if (loading) {
    return <div className="p-4 text-gray-400">Loading workout...</div>;
  }

  if (error || !workout) {
    return <div className="p-4 text-red-400">Error: {error || "Workout not found"}</div>;
  }

  return (
    <div className="space-y-6">
      <WorkoutDetailHeader
        workout={workout}
        onBack={onBack}
        onOpenEdit={openEditWorkout}
        onOpenDelete={() => setConfirmDeleteWorkout(true)}
        onStartSession={onStartSession}
      />

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-200">Exercises</h3>
          <Button
            onClick={() => {
              setIsAddingExercise(true);
              setEditingExerciseId(null);
              setSelectedExerciseId("");
              setExerciseConfig({
                sets: 3,
                reps: 10,
                restSeconds: 60,
                weights: [0, 0, 0],
                repsArray: [10, 10, 10],
              });
            }}
            variant="primary"
            size="sm"
          >
            Add Exercise
          </Button>
        </div>

        <ExerciseFormModal
          open={isAddingExercise}
          isEditing={!!editingExerciseId}
          exercises={exercises}
          selectedExerciseId={selectedExerciseId}
          onSelectExercise={setSelectedExerciseId}
          exerciseConfig={exerciseConfig}
          onChangeConfig={setExerciseConfig}
          onSubmit={handleSubmitExercise}
          onClose={() => setIsAddingExercise(false)}
        />

        {workout.exercises.length === 0 ? (
          <Card className="bg-transparent border-dashed">
            <CardContent className="py-8 text-center text-gray-500">
              No exercises added yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {workout.exercises.map((we, index) => {
              const exercise = exercises.find((e) => e.id === we.exerciseId);
              return (
                <WorkoutExerciseItem
                  key={we.id}
                  workoutExercise={we}
                  exercise={exercise}
                  index={index}
                  totalCount={workout.exercises.length}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onEdit={handleEditClick}
                  onRemove={(id) => setConfirmRemoveId(id)}
                />
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmRemoveId}
        title="Remove Exercise"
        message="Are you sure you want to remove this exercise from your workout?"
        confirmLabel="Remove"
        onConfirm={handleRemoveExercise}
        onCancel={() => setConfirmRemoveId(null)}
        variant="danger"
      />
      <ConfirmDialog
        open={confirmDeleteWorkout}
        title="Delete Workout Plan"
        message="Are you sure you want to delete this workout plan? This will also remove any sessions tracked against it."
        confirmLabel="Delete Plan"
        onConfirm={handleDeleteWorkout}
        onCancel={() => setConfirmDeleteWorkout(false)}
        variant="danger"
      />

      <WorkoutEditModal
        open={isEditWorkoutModalOpen}
        name={editWorkoutName}
        onChangeName={setEditWorkoutName}
        description={editWorkoutDesc}
        onChangeDescription={setEditWorkoutDesc}
        scheduledDay={editWorkoutDay}
        onChangeScheduledDay={setEditWorkoutDay}
        onSubmit={handleSaveWorkout}
        onClose={() => setIsEditWorkoutModalOpen(false)}
      />
    </div>
  );
}
