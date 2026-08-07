import type { Exercise, NewWorkoutExerciseInput } from "@lifeos/contracts";
import Button from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import Modal from "../../../components/ui/Modal.js";
import { Select } from "../../../components/ui/Select.js";

interface ExerciseFormModalProps {
  open: boolean;
  isEditing: boolean;
  exercises: Exercise[];
  selectedExerciseId: string;
  onSelectExercise: (id: string) => void;
  exerciseConfig: NewWorkoutExerciseInput;
  onChangeConfig: (config: NewWorkoutExerciseInput) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function ExerciseFormModal({
  open,
  isEditing,
  exercises,
  selectedExerciseId,
  onSelectExercise,
  exerciseConfig,
  onChangeConfig,
  onSubmit,
  onClose,
}: ExerciseFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Exercise" : "Add Exercise"}>
      <div className="space-y-4">
        <Select
          value={selectedExerciseId}
          disabled={isEditing}
          onChange={(e) => onSelectExercise(e.target.value)}
          options={[
            { value: "", label: "Select an exercise" },
            ...exercises.map((exercise) => ({
              value: exercise.id,
              label: `${exercise.name} (${exercise.muscleGroup})`,
            })),
          ]}
          className="mb-4"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="sets" className="text-sm font-medium text-primary">
              Sets
            </label>
            <Input
              id="sets"
              type="number"
              min="1"
              value={exerciseConfig.sets}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                const newSets = Number.isFinite(parsed) ? Math.max(1, Math.trunc(parsed)) : 1;
                const newWeights = [...(exerciseConfig.weights || [])];
                if (newSets > newWeights.length) {
                  for (let i = newWeights.length; i < newSets; i++) newWeights.push(0);
                }
                const newRepsArray = [...(exerciseConfig.repsArray || [])];
                if (newSets > newRepsArray.length) {
                  for (let i = newRepsArray.length; i < newSets; i++) newRepsArray.push(10);
                }
                onChangeConfig({
                  ...exerciseConfig,
                  sets: newSets,
                  weights: newWeights.slice(0, newSets),
                  repsArray: newRepsArray.slice(0, newSets),
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="rest" className="text-sm font-medium text-primary">
              Rest (s)
            </label>
            <Input
              id="rest"
              type="number"
              min="0"
              value={exerciseConfig.restSeconds}
              onChange={(e) =>
                onChangeConfig({ ...exerciseConfig, restSeconds: Number(e.target.value) })
              }
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-primary block mb-2">Configure Sets</label>
            <div className="flex flex-col gap-2">
              {Array.from({ length: exerciseConfig.sets || 3 }, (_, idx) => idx + 1).map(
                (setNum) => (
                  <div
                    key={`set-${setNum}`}
                    className="flex items-center gap-2 bg-card-solid/30 p-2 rounded-lg"
                  >
                    <span className="text-xs font-semibold text-secondary w-12">Set {setNum}</span>
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-muted uppercase">Reps</label>
                        <Input
                          type="number"
                          min="1"
                          value={exerciseConfig.repsArray?.[setNum - 1] || ""}
                          onChange={(e) => {
                            const newRepsArray = [...(exerciseConfig.repsArray || [])];
                            newRepsArray[setNum - 1] = Number(e.target.value);
                            onChangeConfig({ ...exerciseConfig, repsArray: newRepsArray });
                          }}
                          className="text-center h-8 text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-muted uppercase">Weight (kg)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={exerciseConfig.weights?.[setNum - 1] || ""}
                          onChange={(e) => {
                            const newWeights = [...(exerciseConfig.weights || [])];
                            newWeights[setNum - 1] = Number(e.target.value);
                            onChangeConfig({ ...exerciseConfig, weights: newWeights });
                          }}
                          className="text-center h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            {isEditing ? "Save Changes" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
