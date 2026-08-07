import type { HabitDailyProgress, WalkingHabitConfig } from "@lifeos/contracts";
import { Check, Edit3, Plus, RotateCcw } from "lucide-react";
import type React from "react";
import { useState } from "react";
import Button from "../../../components/ui/Button.js";
import Card, { CardContent, CardHeader, CardTitle } from "../../../components/ui/Card.js";

interface WalkingWidgetProps {
  progress: HabitDailyProgress;
  onLog: (value: number) => void;
  onUnlog?: (logId: string) => void;
}

export function WalkingWidget({ progress, onLog, onUnlog }: WalkingWidgetProps) {
  const config = progress.habit?.config as WalkingHabitConfig;
  const unit = config?.unit || "steps";
  const isKm = unit === "km";

  const presets = isKm ? [1, 2, 5] : [1000, 2000, 5000];
  const currentValue = progress.currentValue || 0;
  const targetValue = progress.targetValue || (isKm ? 5 : 10000);
  const percentage = Math.min(100, Math.max(0, Math.round((currentValue / targetValue) * 100)));

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(customValue);
    if (!Number.isNaN(val) && val > 0) {
      onLog(val);
      setCustomValue("");
      setShowCustomInput(false);
    }
  };

  const lastLog =
    progress.logs && progress.logs.length > 0 ? progress.logs[progress.logs.length - 1] : null;

  return (
    <Card className="bg-surface border border-border hover:border-border-subtle/80 transition-all">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-primary flex items-center gap-2 text-sm font-semibold">
          <span className="text-xl">{progress.habit?.icon || "🚶"}</span>
          {progress.habit?.name || "Walking"}
        </CardTitle>
        <span className="text-xs font-mono font-medium text-orange-400">
          {currentValue.toLocaleString()} / {targetValue.toLocaleString()} {unit}
        </span>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        <div className="h-3 bg-card-solid rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-linear-to-r from-orange-600 to-orange-400 transition-all duration-700 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2 justify-between">
            {presets.map((p) => (
              <Button
                key={p}
                size="sm"
                variant="secondary"
                className="flex-1 bg-card hover:bg-card-hover text-primary border-border text-xs py-1"
                onClick={() => onLog(p)}
              >
                <Plus size={12} className="mr-1 text-orange-400" />
                {p} {isKm ? "km" : ""}
              </Button>
            ))}
            <Button
              size="sm"
              variant="secondary"
              title={`Log custom ${unit}`}
              className="bg-card hover:bg-card-hover text-primary border-border py-1"
              onClick={() => setShowCustomInput(!showCustomInput)}
            >
              <Edit3 size={12} />
            </Button>
            {lastLog && onUnlog && (
              <Button
                size="sm"
                variant="secondary"
                title="Undo last log"
                className="bg-card hover:bg-red-900/40 text-secondary hover:text-red-300 border-border py-1"
                onClick={() => onUnlog(lastLog.id)}
              >
                <RotateCcw size={12} />
              </Button>
            )}
          </div>

          {showCustomInput && (
            <form onSubmit={handleCustomSubmit} className="flex gap-2 w-full animate-fade-in pt-1">
              <input
                type="number"
                step={isKm ? "0.1" : "1"}
                autoFocus
                placeholder={`Custom ${unit}`}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="flex-1 bg-surface border border-border-subtle rounded-lg px-3 py-1 text-xs text-primary placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
              <Button
                size="sm"
                type="submit"
                variant="primary"
                className="bg-orange-600 hover:bg-orange-500 text-white text-xs py-1"
              >
                <Check size={12} className="mr-1" /> Add
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
