import type { HabitWithStreak } from "@lifeos/contracts";

interface HabitChipProps {
  habit: HabitWithStreak;
  onToggle: (habitId: string) => void;
}

export default function HabitChip({ habit, onToggle }: HabitChipProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(habit.id)}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        habit.loggedToday
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${habit.loggedToday ? "bg-green-500" : "bg-gray-400"}`}
      />
      {habit.name}
      {habit.currentStreak > 0 && (
        <span className="text-xs opacity-75">🔥 {habit.currentStreak}</span>
      )}
    </button>
  );
}
