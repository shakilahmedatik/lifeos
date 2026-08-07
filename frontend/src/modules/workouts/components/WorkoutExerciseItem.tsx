import type { Exercise, WorkoutExercise } from "@lifeos/contracts";
import { ChevronDown as ChevronDownIcon, ChevronUp as ChevronUpIcon } from "lucide-react";
import Button from "../../../components/ui/Button.js";
import Card, { CardContent } from "../../../components/ui/Card.js";

interface WorkoutExerciseItemProps {
  workoutExercise: WorkoutExercise;
  exercise?: Exercise;
  index: number;
  totalCount: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEdit: (we: WorkoutExercise) => void;
  onRemove: (id: string) => void;
}

export function WorkoutExerciseItem({
  workoutExercise: we,
  exercise,
  index,
  totalCount,
  onMoveUp,
  onMoveDown,
  onEdit,
  onRemove,
}: WorkoutExerciseItemProps) {
  return (
    <Card className="hover:border-border-subtle transition-colors">
      <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex flex-col items-center border-r border-border pr-4 gap-1">
            <button
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              className="text-muted hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronUpIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onMoveDown(index)}
              disabled={index === totalCount - 1}
              className="text-muted hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronDownIcon className="w-5 h-5" />
            </button>
          </div>
          <div>
            <p className="font-semibold text-primary">{exercise?.name || "Unknown Exercise"}</p>
            <p className="text-sm text-secondary mt-1">
              {we.repsArray && we.repsArray.length > 0 ? (
                <span>
                  <span className="font-medium text-primary">{we.sets}</span> sets &times;{" "}
                  <span className="font-medium text-primary">[{we.repsArray.join(", ")}]</span>{" "}
                  reps
                </span>
              ) : (
                <span>
                  <span className="font-medium text-primary">{we.sets}</span> sets &times;{" "}
                  <span className="font-medium text-primary">{we.reps}</span> reps
                </span>
              )}
              {we.weights && we.weights.length > 0 ? (
                <span>
                  {" "}
                  @ <span className="font-medium text-primary">[{we.weights.join(", ")}]</span> kg
                </span>
              ) : we.weight ? (
                <span>
                  {" "}
                  @ <span className="font-medium text-primary">{we.weight}</span> kg
                </span>
              ) : null}
              <span className="mx-2 text-muted">|</span>
              <span className="font-medium text-primary">{we.restSeconds}s</span> rest
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onEdit(we)} variant="secondary" size="sm">
            Edit
          </Button>
          <Button
            onClick={() => onRemove(we.id)}
            variant="secondary"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
          >
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
