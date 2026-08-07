import type { HabitDailyProgress, PrayerHabitConfig } from "@lifeos/contracts";
import { Check } from "lucide-react";
import Card, { CardContent, CardHeader, CardTitle } from "../../../components/ui/Card.js";

interface PrayerWidgetProps {
  progress: HabitDailyProgress;
  onLog: (value: number, meta: string) => void;
  onUnlog: (logId: string) => void;
}

export function PrayerWidget({ progress, onLog, onUnlog }: PrayerWidgetProps) {
  const config = progress.habit?.config as PrayerHabitConfig;
  const prayers = config?.prayers || [
    { name: "Fajr", time: "05:00" },
    { name: "Dhuhr", time: "13:00" },
    { name: "Asr", time: "16:30" },
    { name: "Maghrib", time: "19:00" },
    { name: "Isha", time: "20:30" },
  ];

  const currentValue = progress.currentValue || 0;

  return (
    <Card className="bg-surface border border-border hover:border-border-subtle/80 transition-all">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-primary flex items-center gap-2 text-sm font-semibold">
          <span className="text-xl">{progress.habit?.icon || "🕌"}</span>
          {progress.habit?.name || "Daily Salah"}
        </CardTitle>
        <span className="text-xs font-mono font-medium text-emerald-400">
          {currentValue} / {prayers.length} prayers
        </span>
      </CardHeader>

      <CardContent className="pt-1">
        <div className="grid grid-cols-5 gap-1.5">
          {prayers.map((prayer) => {
            const logged = progress.logs?.find((l) => l.meta === prayer.name);
            const isCompleted = !!logged;
            return (
              <button
                key={prayer.name}
                type="button"
                className={`py-2 px-1 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  isCompleted
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : "bg-surface-elevated border-border text-secondary hover:border-border-subtle hover:bg-card-solid/80"
                }`}
                onClick={() => {
                  if (isCompleted && logged) {
                    onUnlog(logged.id);
                  } else {
                    onLog(1, prayer.name);
                  }
                }}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isCompleted
                      ? "bg-emerald-500 text-gray-950 font-bold"
                      : "bg-card-hover text-secondary"
                  }`}
                >
                  {isCompleted ? <Check size={12} strokeWidth={3} /> : prayer.name[0]}
                </div>
                <span className="text-[11px] font-medium truncate w-full text-center">
                  {prayer.name}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
