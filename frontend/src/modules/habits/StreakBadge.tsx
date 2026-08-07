interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
}

export default function StreakBadge({ currentStreak, longestStreak }: StreakBadgeProps) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="text-orange-500">🔥</span>
      <span className="font-medium">{currentStreak}</span>
      {longestStreak > currentStreak && (
        <span className="text-secondary text-xs">(best: {longestStreak})</span>
      )}
    </div>
  );
}
