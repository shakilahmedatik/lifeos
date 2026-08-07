import type { Exercise, WorkoutWithExercises } from "@lifeos/contracts";
import { Play as PlayIcon } from "lucide-react";
import Button from "../../../components/ui/Button.js";
import Modal from "../../../components/ui/Modal.js";

interface CoachStartModalProps {
  workout: WorkoutWithExercises;
  exercises: Exercise[];
  onStart: () => void;
  onExit: () => void;
}

export function CoachStartModal({ workout, exercises, onStart, onExit }: CoachStartModalProps) {
  return (
    <Modal open={true} onClose={onExit} title="Start Workout Session">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-primary">{workout.name}</h3>
          {workout.description && (
            <p className="text-sm text-secondary mt-1">{workout.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 bg-surface-elevated p-4 rounded-xl border border-border text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{workout.exercises.length}</p>
            <p className="text-xs text-secondary font-medium uppercase tracking-wider mt-0.5">
              Exercises
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">
              {workout.exercises.reduce((acc, we) => acc + we.sets, 0)}
            </p>
            <p className="text-xs text-secondary font-medium uppercase tracking-wider mt-0.5">
              Total Sets
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
            Exercise Plan
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {workout.exercises.map((we, idx) => {
              const ex = exercises.find((e) => e.id === we.exerciseId);
              return (
                <div
                  key={we.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card-solid/30 border border-border text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-card-solid text-secondary font-mono text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-primary">{ex?.name || "Exercise"}</span>
                  </div>
                  <span className="text-xs text-secondary font-medium">
                    {we.sets} sets • {we.reps} reps
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={onStart}
            variant="primary"
            className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm md:text-base shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
          >
            <PlayIcon size={18} />
            Start Workout
          </Button>
          <Button
            onClick={onExit}
            variant="secondary"
            className="h-11 px-5 text-primary hover:bg-card-solid border-border-subtle font-medium text-sm"
          >
            Exit
          </Button>
        </div>
      </div>
    </Modal>
  );
}
