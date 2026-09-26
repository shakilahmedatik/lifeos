import {
  Coffee as CoffeeIcon,
  Dumbbell as DumbbellIcon,
  Flame as FlameIcon,
  Pause as PauseIcon,
  Play as PlayIcon,
} from "lucide-react";
import Button from "../../../components/ui/Button.js";

interface TimerState {
  isRunning: boolean;
  isResting: boolean;
  seconds: number;
  targetSeconds: number;
}

interface RestTimerDisplayProps {
  timer: TimerState;
  currentSet: number;
  totalSets: number;
  actualReps: number;
  actualWeight: number;
  onSkipRest: () => void;
  onAddRestTime: (seconds: number) => void;
  onCompleteSet: () => void;
  onToggleTimer: (isRunning: boolean) => void;
}

export function RestTimerDisplay({
  timer,
  currentSet,
  totalSets,
  actualReps,
  actualWeight,
  onSkipRest,
  onAddRestTime,
  onCompleteSet,
  onToggleTimer,
}: RestTimerDisplayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col justify-between flex-1 min-h-0 w-full gap-3 md:gap-4">
      {/* Timer Display Box */}
      <div
        className={`text-center p-3 sm:p-4 md:p-5 rounded-2xl border transition-all duration-500 ease-in-out shadow-lg flex-1 min-h-0 flex flex-col items-center justify-between ${
          timer.isResting
            ? "bg-linear-to-b from-amber-500/10 via-surface-elevated to-surface-elevated border-amber-500/30 shadow-amber-500/5"
            : "bg-linear-to-b from-emerald-500/10 via-surface-elevated to-surface-elevated border-emerald-500/30 shadow-emerald-500/5"
        }`}
      >
        {/* Status Pill */}
        <div className="h-7 px-3 flex items-center justify-center rounded-full bg-surface/80 border border-border/80 shadow-xs shrink-0">
          {timer.isResting ? (
            <span
              key="rest-pill"
              className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px] sm:text-xs uppercase tracking-wider animate-fade-in"
            >
              <CoffeeIcon size={14} className="animate-pulse text-amber-400" />
              Rest Period
            </span>
          ) : (
            <span
              key="set-pill"
              className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] sm:text-xs uppercase tracking-wider animate-fade-in"
            >
              <FlameIcon size={14} className="animate-pulse text-emerald-400" />
              Set Active
            </span>
          )}
        </div>

        {/* Circular Timer Display */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 lg:w-52 lg:h-52 mx-auto flex items-center justify-center my-1 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="84"
              className="stroke-gray-800/60 fill-none"
              strokeWidth="8"
            />
            <circle
              key={timer.isResting ? "rest-gauge" : "set-gauge"}
              cx="100"
              cy="100"
              r="84"
              className={`fill-none transition-all duration-1000 ease-linear animate-fade-in ${
                timer.isResting
                  ? "stroke-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  : "stroke-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              }`}
              strokeWidth="8"
              strokeDasharray="527.7"
              strokeDashoffset={
                timer.targetSeconds > 0 ? 527.7 * (1 - timer.seconds / timer.targetSeconds) : 0
              }
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
            <p
              className={`text-3xl sm:text-4xl md:text-5xl font-mono font-bold tracking-tight transition-colors duration-500 ${
                timer.isResting
                  ? "text-amber-400 drop-shadow-[0_0_16px_rgba(245,158,11,0.4)]"
                  : "text-emerald-400 drop-shadow-[0_0_16px_rgba(16,185,129,0.4)]"
              }`}
            >
              {formatTime(timer.seconds)}
            </p>
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-secondary mt-1 transition-all duration-500">
              {timer.isResting ? "Catch your breath" : "Focus & Work"}
            </p>
          </div>
        </div>

        {/* Subtext info line */}
        <div className="h-5 flex items-center justify-center shrink-0">
          <p className="text-[11px] sm:text-xs text-secondary uppercase tracking-wider font-medium text-center">
            {timer.isResting
              ? `Resting before Set ${currentSet} of ${totalSets}`
              : `Set ${currentSet} • ${actualReps} Reps @ ${actualWeight}kg`}
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="w-full shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="sm:col-span-2 flex gap-2">
          {timer.isResting ? (
            <>
              <Button
                onClick={onSkipRest}
                variant="primary"
                className="flex-1 h-10 sm:h-11 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-amber-900/20 transition-all flex items-center justify-center gap-1.5"
              >
                <DumbbellIcon size={16} />
                Skip Rest & Start Set
              </Button>
              <Button
                onClick={() => onAddRestTime(30)}
                variant="secondary"
                className="h-10 sm:h-11 px-3 text-amber-300 border-amber-800/50 bg-amber-950/30 hover:bg-amber-900/40 text-xs font-medium transition-all shrink-0"
              >
                +30s
              </Button>
            </>
          ) : (
            <Button
              onClick={onCompleteSet}
              variant="primary"
              className="w-full h-10 sm:h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-emerald-900/20 transition-all flex items-center justify-center gap-1.5"
            >
              <FlameIcon size={16} />
              Complete Set {currentSet}
            </Button>
          )}
        </div>

        <div className="sm:col-span-1">
          {timer.isRunning ? (
            <Button
              onClick={() => onToggleTimer(false)}
              variant="secondary"
              className="w-full h-10 sm:h-11 text-primary hover:bg-card-solid border-border-subtle transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm"
            >
              <PauseIcon size={16} />
              Pause
            </Button>
          ) : (
            timer.seconds > 0 && (
              <Button
                onClick={() => onToggleTimer(true)}
                variant="primary"
                className="w-full h-10 sm:h-11 bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm"
              >
                <PlayIcon size={16} />
                Resume
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
