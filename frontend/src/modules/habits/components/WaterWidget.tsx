import type { HabitDailyProgress, WaterHabitConfig } from "@lifeos/contracts";
import { Check, Edit3, Plus, RotateCcw } from "lucide-react";
import type React from "react";
import { useState } from "react";
import Button from "../../../components/ui/Button.js";
import Card, { CardContent, CardHeader, CardTitle } from "../../../components/ui/Card.js";

interface WaterWidgetProps {
  progress: HabitDailyProgress;
  onLog: (value: number) => void;
  onUnlog?: (logId: string) => void;
}

export function WaterWidget({ progress, onLog, onUnlog }: WaterWidgetProps) {
  const config = progress.habit?.config as WaterHabitConfig;
  const presets = config?.sessionPresetsMl || [250, 500];
  const currentValue = progress.currentValue || 0;
  const targetValue = progress.targetValue || 2000;
  const percentage = Math.min(100, Math.max(0, Math.round((currentValue / targetValue) * 100)));

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customMl, setCustomMl] = useState("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(customMl);
    if (!Number.isNaN(val) && val > 0) {
      onLog(val);
      setCustomMl("");
      setShowCustomInput(false);
    }
  };

  return (
    <Card className="bg-surface border border-border hover:border-border-subtle/80 transition-all">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-primary flex items-center gap-2 text-sm font-semibold">
          <span className="text-xl">{progress.habit?.icon || "💧"}</span>
          {progress.habit?.name || "Water Intake"}
        </CardTitle>
        <span className="text-xs font-mono font-medium text-blue-400">
          {currentValue.toLocaleString()} / {targetValue.toLocaleString()} ml
        </span>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {/* Animated Water Level Bar */}
        <div className="relative h-3 bg-card-solid rounded-full overflow-hidden border border-border">
          <div
            className="h-full relative transition-all duration-700 ease-out bg-linear-to-r from-blue-600 to-blue-400 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 justify-between items-center">
            {presets.map((amount) => (
              <Button
                key={amount}
                size="sm"
                variant="secondary"
                className="flex-1 bg-card hover:bg-card-hover text-primary border-border text-xs py-1"
                onClick={() => onLog(amount)}
              >
                <Plus size={12} className="mr-1 text-blue-400" />
                {amount} ml
              </Button>
            ))}

            <Button
              size="sm"
              variant="secondary"
              title="Log custom ml"
              className="bg-card hover:bg-card-hover text-primary border-border py-1"
              onClick={() => setShowCustomInput(!showCustomInput)}
            >
              <Edit3 size={12} />
            </Button>

            {currentValue > 0 && progress.logs && progress.logs.length > 0 && onUnlog && (
              <Button
                size="sm"
                variant="secondary"
                title="Undo last log"
                className="bg-card hover:bg-red-900/40 text-secondary hover:text-red-300 border-border py-1"
                onClick={() => onUnlog(progress.logs[progress.logs.length - 1].id)}
              >
                <RotateCcw size={12} />
              </Button>
            )}
          </div>

          {showCustomInput && (
            <form onSubmit={handleCustomSubmit} className="flex gap-2 w-full animate-fade-in pt-1">
              <input
                type="number"
                autoFocus
                placeholder="Custom ml (e.g. 350)"
                value={customMl}
                onChange={(e) => setCustomMl(e.target.value)}
                className="flex-1 bg-surface border border-border-subtle rounded-lg px-3 py-1 text-xs text-primary placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <Button
                size="sm"
                type="submit"
                variant="primary"
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs py-1"
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
