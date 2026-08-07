import type { HabitDailyProgress } from "@lifeos/contracts";
import { Check } from "lucide-react";
import Card, { CardContent } from "../../../components/ui/Card.js";

interface BooleanWidgetProps {
  progress: HabitDailyProgress;
  onLog: (value: number) => void;
  onUnlog: (logId: string) => void;
}

export function BooleanWidget({ progress, onLog, onUnlog }: BooleanWidgetProps) {
  const currentValue = progress.currentValue || 0;
  const targetValue = progress.targetValue || 1;
  const isCompleted = currentValue >= targetValue;

  return (
    <Card
      className={`cursor-pointer transition-all duration-300 border ${
        isCompleted
          ? "bg-surface border-emerald-500/40 shadow-sm shadow-emerald-500/20"
          : "bg-surface border-border hover:border-border-subtle"
      }`}
      onClick={() => {
        if (isCompleted && progress.logs && progress.logs.length > 0) {
          onUnlog(progress.logs[progress.logs.length - 1].id);
        } else {
          onLog(1);
        }
      }}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
              isCompleted
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                : "bg-card-solid/80 border-border-subtle text-muted"
            }`}
          >
            <Check size={18} className={isCompleted ? "scale-100" : "scale-50 opacity-50"} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-primary">
              {progress.habit?.name || "Habit"}
            </h3>
            <div className="text-xs text-muted flex gap-2 mt-0.5">
              <span>{progress.habit?.icon}</span>
              {progress.currentStreak > 0 && (
                <span className="text-orange-400 font-medium">
                  🔥 {progress.currentStreak} day streak
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
