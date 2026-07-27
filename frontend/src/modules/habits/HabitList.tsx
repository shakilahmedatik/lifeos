import type { Habit } from "@lifeos/contracts";
import StreakBadge from "./StreakBadge.js";

interface HabitListProps {
  habits: Habit[];
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

export default function HabitList({ habits, onEdit, onDelete }: HabitListProps) {
  return (
    <div className="space-y-2">
      {habits.map((habit) => (
        <div
          key={habit.id}
          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <div>
              <div className="font-medium">{habit.name}</div>
              <div className="text-sm text-gray-500">
                {habit.frequency} · {habit.category}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StreakBadge currentStreak={0} longestStreak={0} />
            <button
              type="button"
              onClick={() => onEdit(habit)}
              className="text-gray-500 hover:text-gray-700"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(habit.id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
