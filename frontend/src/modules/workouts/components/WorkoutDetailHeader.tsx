import type { WorkoutWithExercises } from "@lifeos/contracts";
import { Edit as EditIcon, Trash2 as TrashIcon } from "lucide-react";
import Badge from "../../../components/ui/Badge.js";
import Button from "../../../components/ui/Button.js";
import Card, { CardContent } from "../../../components/ui/Card.js";

interface WorkoutDetailHeaderProps {
  workout: WorkoutWithExercises;
  onBack?: () => void;
  onOpenEdit: () => void;
  onOpenDelete: () => void;
  onStartSession?: () => void;
}

export function WorkoutDetailHeader({
  workout,
  onBack,
  onOpenEdit,
  onOpenDelete,
  onStartSession,
}: WorkoutDetailHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="secondary" onClick={onBack}>
          &larr; Back
        </Button>
        <div className="flex gap-2">
          <Button onClick={onOpenEdit} variant="secondary" size="sm">
            <EditIcon className="w-4 h-4 mr-2" />
            Edit Plan
          </Button>
          <Button
            onClick={onOpenDelete}
            variant="secondary"
            size="sm"
            className="text-red-400 hover:bg-red-900/20 hover:text-red-300 border-red-900/30"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete Plan
          </Button>
          <Button
            onClick={onStartSession}
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={workout.exercises.length === 0}
          >
            Start Session
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-2 text-primary">{workout.name}</h2>
          {workout.description && <p className="text-secondary mb-4">{workout.description}</p>}
          {workout.scheduledDay && (
            <Badge variant="blue" className="mb-4 bg-blue-900/30 text-blue-400">
              Scheduled:{" "}
              {workout.scheduledDay.charAt(0).toUpperCase() + workout.scheduledDay.slice(1)}
              {workout.scheduledTime && ` at ${workout.scheduledTime}`}
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
