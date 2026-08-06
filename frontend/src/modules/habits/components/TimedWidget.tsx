import type { HabitDailyProgress } from "@lifeos/contracts";
import { Plus, RotateCcw } from "lucide-react";
import Button from "../../../components/ui/Button.js";
import Card, { CardContent, CardHeader, CardTitle } from "../../../components/ui/Card.js";

interface TimedWidgetProps {
  progress: HabitDailyProgress;
  onLog: (value: number) => void;
  onUnlog?: (logId: string) => void;
}

export function TimedWidget({ progress, onLog, onUnlog }: TimedWidgetProps) {
  const presets = [15, 30, 60];
  const currentValue = progress.currentValue || 0;
  const targetValue = progress.targetValue || 30;
  const percentage = Math.min(100, Math.max(0, Math.round((currentValue / targetValue) * 100)));
  const lastLog = progress.logs && progress.logs.length > 0 ? progress.logs[progress.logs.length - 1] : null;

  return (
    <Card className="bg-gray-900/60 border border-gray-800 hover:border-gray-700/80 transition-all">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-gray-200 flex items-center gap-2 text-sm font-semibold">
          <span className="text-xl">{progress.habit?.icon || "⏳"}</span>
          {progress.habit?.name || "Timed Activity"}
        </CardTitle>
        <span className="text-xs font-mono font-medium text-purple-400">
          {currentValue} / {targetValue} min
        </span>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700/60">
          <div
            className="h-full bg-linear-to-r from-purple-600 to-purple-400 transition-all duration-700 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex gap-2 justify-between">
          {presets.map((p) => (
            <Button
              key={p}
              size="sm"
              variant="secondary"
              className="flex-1 bg-gray-800/60 hover:bg-gray-700/80 text-gray-200 border-gray-700/60 text-xs py-1"
              onClick={() => onLog(p)}
            >
              <Plus size={12} className="mr-1 text-purple-400" />
              {p}m
            </Button>
          ))}
          {lastLog && onUnlog && (
            <Button
              size="sm"
              variant="secondary"
              title="Undo last log"
              className="bg-gray-800/60 hover:bg-red-900/40 text-gray-400 hover:text-red-300 border-gray-700/60 py-1"
              onClick={() => onUnlog(lastLog.id)}
            >
              <RotateCcw size={12} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
