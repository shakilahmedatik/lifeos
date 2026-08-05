import type { HabitDefinition, HabitWithStreak } from "@lifeos/contracts";
import StreakBadge from "./StreakBadge.js";

interface HabitListProps {
  habits: (HabitDefinition | HabitWithStreak)[];
  onEdit: (habit: HabitDefinition) => void;
  onDelete: (habitId: string) => void;
}

export default function HabitList({ habits, onEdit, onDelete }: HabitListProps) {
  return (
    <div className="space-y-2">
      {habits.map((habit) => {
        const withStreak = "currentStreak" in habit ? (habit as HabitWithStreak) : null;

        return (
          <div
            key={habit.id}
            className="flex items-center justify-between p-3 bg-gray-900/60 rounded-lg border border-gray-800"
          >
            <div className="flex items-center gap-3">
              <div>
                <div className="font-medium text-gray-200">{habit.name}</div>
                <div className="text-sm text-gray-500">
                  {habit.type} · {habit.category}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StreakBadge
                currentStreak={withStreak?.currentStreak ?? 0}
                longestStreak={withStreak?.longestStreak ?? 0}
              />
              <button
                type="button"
                onClick={() => onEdit(habit)}
                className="text-gray-400 hover:text-gray-200 text-xs"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(habit.id)}
                className="text-red-400 hover:text-red-300 text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
