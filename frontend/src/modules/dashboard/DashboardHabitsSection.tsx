import { getClientDateString, type HabitDailyProgress } from "@lifeos/contracts";
import { ArrowRight, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card, { CardHeader, CardTitle } from "../../components/ui/Card.js";
import { BooleanWidget } from "../habits/components/BooleanWidget.js";
import { PrayerWidget } from "../habits/components/PrayerWidget.js";
import { TimedWidget } from "../habits/components/TimedWidget.js";
import { WalkingWidget } from "../habits/components/WalkingWidget.js";
import { WaterWidget } from "../habits/components/WaterWidget.js";

interface DashboardHabitsSectionProps {
  habitsProgress: HabitDailyProgress[];
  onLog: (habitId: string, value: number, meta?: string) => void;
  onUnlog: (logId: string) => void;
}

export function DashboardHabitsSection({
  habitsProgress,
  onLog,
  onUnlog,
}: DashboardHabitsSectionProps) {
  const navigate = useNavigate();

  if (!habitsProgress || habitsProgress.length === 0) return null;

  const completedCount = habitsProgress.filter((prog) => {
    const val = prog.currentValue ?? 0;
    const tgt = prog.targetValue ?? 1;
    return val >= tgt;
  }).length;

  return (
    <Card className="bg-card border-gray-800">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <CheckCheck size={18} className="text-emerald-400" />
          <span>Today's Habits</span>
          <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 ml-1">
            {completedCount}/{habitsProgress.length} done
          </span>
        </CardTitle>
        <button
          onClick={() => navigate("/habits")}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
        >
          View Analytics <ArrowRight size={14} />
        </button>
      </CardHeader>

      {/* Grid Container — No Horizontal Scrolling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 pt-1">
        {habitsProgress.map((prog) => {
          const habit = prog?.habit;
          if (!habit?.type) return null;

          const normalized: HabitDailyProgress = {
            habit: habit,
            date: prog.date || getClientDateString(),
            currentValue: prog.currentValue ?? 0,
            targetValue: prog.targetValue ?? 1,
            progress: prog.progress ?? 0,
            logs: prog.logs || [],
            currentStreak: prog.currentStreak ?? 0,
            longestStreak: prog.longestStreak ?? 0,
          };

          const handleLog = (val: number, meta?: string) => onLog(habit.id, val, meta);

          switch (habit.type) {
            case "water":
              return (
                <WaterWidget
                  key={habit.id}
                  progress={normalized}
                  onLog={handleLog}
                  onUnlog={onUnlog}
                />
              );
            case "prayer":
              return (
                <PrayerWidget
                  key={habit.id}
                  progress={normalized}
                  onLog={handleLog}
                  onUnlog={onUnlog}
                />
              );
            case "walking":
              return (
                <WalkingWidget
                  key={habit.id}
                  progress={normalized}
                  onLog={handleLog}
                  onUnlog={onUnlog}
                />
              );
            case "timed":
              return (
                <TimedWidget
                  key={habit.id}
                  progress={normalized}
                  onLog={handleLog}
                  onUnlog={onUnlog}
                />
              );
            case "boolean":
              return (
                <BooleanWidget
                  key={habit.id}
                  progress={normalized}
                  onLog={handleLog}
                  onUnlog={onUnlog}
                />
              );
            default:
              return null;
          }
        })}
      </div>
    </Card>
  );
}
