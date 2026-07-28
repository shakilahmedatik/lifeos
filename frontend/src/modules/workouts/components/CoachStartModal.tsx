import type { Exercise, WorkoutWithExercises } from "@lifeos/contracts";
import Button from "../../../components/ui/Button.js";
import { PlayIcon } from "../../../components/ui/icons.js";
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
          <h3 className="text-xl font-bold text-gray-100">{workout.name}</h3>
          {workout.description && (
            <p className="text-sm text-gray-400 mt-1">{workout.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-100">{workout.exercises.length}</p>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">
              Exercises
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-100">
              {workout.exercises.reduce((acc, we) => acc + we.sets, 0)}
            </p>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">
              Total Sets
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Exercise Plan
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {workout.exercises.map((we, idx) => {
              const ex = exercises.find((e) => e.id === we.exerciseId);
              return (
                <div
                  key={we.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/40 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-800 text-gray-400 font-mono text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-200">{ex?.name || "Exercise"}</span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
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
            className="h-11 px-5 text-gray-300 hover:bg-gray-800 border-gray-700 font-medium text-sm"
          >
            Exit
          </Button>
        </div>
      </div>
    </Modal>
  );
}
