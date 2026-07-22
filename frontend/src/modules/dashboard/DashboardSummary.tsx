import type { DashboardSummary as DashboardSummaryType } from "../../../../packages/contracts/src/index.js";
import { FinanceWidget } from "../finance/FinanceWidget.js";
import HabitChip from "../habits/HabitChip.js";
import NewsTicker from "./NewsTicker.js";
import NextCard from "./NextCard.js";
import NowCard from "./NowCard.js";

interface DashboardSummaryProps {
  summary: DashboardSummaryType | null;
  onHabitToggle?: (habitId: string) => void;
}

export default function DashboardSummary({ summary, onHabitToggle }: DashboardSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NowCard task={summary?.now ?? null} />
        <NextCard task={summary?.next ?? null} />
      </div>
      {summary && (
        <div className="text-center text-sm text-gray-500">
          {summary.todayDoneCount}/{summary.todayCount} tasks done today
        </div>
      )}
      <NewsTicker />
      {summary?.dueHabits && summary.dueHabits.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {summary.dueHabits.map((habit) => (
            <HabitChip key={habit.id} habit={habit} onToggle={() => onHabitToggle?.(habit.id)} />
          ))}
        </div>
      )}
      <FinanceWidget />
    </div>
  );
}
