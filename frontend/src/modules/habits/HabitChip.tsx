import type { HabitWithStreak } from "@lifeos/contracts";

interface HabitChipProps {
  habit: HabitWithStreak;
  onToggle: (habitId: string) => void;
}

export default function HabitChip({ habit, onToggle }: HabitChipProps) {
  const isCompleted =
    habit.todayValue !== undefined &&
    habit.todayTarget !== undefined &&
    habit.todayValue >= habit.todayTarget;
  const isLogged = habit.loggedToday || isCompleted;

  return (
    <button
      type="button"
      onClick={() => onToggle(habit.id)}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        isLogged
          ? "bg-green-100/10 text-green-400 border border-green-500/30"
          : "bg-card-solid text-primary border border-border-subtle hover:bg-card-hover"
      }`}
    >
      <span className="text-lg">{habit.icon}</span>
      {habit.name}
      {habit.currentStreak > 0 && (
        <span className="text-xs opacity-75 ml-1 text-orange-400">🔥 {habit.currentStreak}</span>
      )}
    </button>
  );
}
