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
    <>
      <div
        className={`text-center mb-8 p-6 md:p-8 rounded-2xl border transition-all duration-700 ease-in-out shadow-xl min-h-95 flex flex-col items-center justify-between ${
          timer.isResting
            ? "bg-linear-to-b from-amber-950/40 via-gray-900/70 to-gray-900/90 border-amber-500/30 shadow-[0_0_35px_rgba(245,158,11,0.15)]"
            : "bg-linear-to-b from-emerald-950/40 via-gray-900/70 to-gray-900/90 border-emerald-500/30 shadow-[0_0_35px_rgba(16,185,129,0.15)]"
        }`}
      >
        <div className="h-9 w-36 flex items-center justify-center rounded-full bg-gray-950/60 border border-gray-800 transition-all duration-700 shadow-inner">
          {timer.isResting ? (
            <span
              key="rest-pill"
              className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-widest animate-fade-in"
            >
              <CoffeeIcon size={16} className="animate-pulse text-amber-400" />
              Rest Period
            </span>
          ) : (
            <span
              key="set-pill"
              className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-widest animate-fade-in"
            >
              <FlameIcon size={16} className="animate-pulse text-emerald-400" />
              Set Active
            </span>
          )}
        </div>

        <div className="relative w-52 h-52 md:w-60 md:h-60 mx-auto flex items-center justify-center my-2">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="84"
              className="stroke-gray-800/80 fill-none"
              strokeWidth="10"
            />
            <circle
              key={timer.isResting ? "rest-gauge" : "set-gauge"}
              cx="100"
              cy="100"
              r="84"
              className={`fill-none transition-all duration-1000 ease-linear animate-fade-in ${
                timer.isResting
                  ? "stroke-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                  : "stroke-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]"
              }`}
              strokeWidth="10"
              strokeDasharray="527.7"
              strokeDashoffset={
                timer.targetSeconds > 0 ? 527.7 * (1 - timer.seconds / timer.targetSeconds) : 0
              }
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <p
              className={`text-5xl md:text-6xl font-mono font-bold tracking-tight transition-colors duration-700 ${
                timer.isResting
                  ? "text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                  : "text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]"
              }`}
            >
              {formatTime(timer.seconds)}
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mt-2 transition-all duration-700">
              {timer.isResting ? "Catch your breath" : "Focus & Work"}
            </p>
          </div>
        </div>

        <div className="h-6 flex items-center justify-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
            {timer.isResting
              ? `Resting before Set ${currentSet} of ${totalSets}`
              : `Set ${currentSet} • ${actualReps} Reps @ ${actualWeight}kg`}
          </p>
        </div>
      </div>

      <div className="w-full min-h-13 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 flex gap-2">
          {timer.isResting ? (
            <>
              <Button
                onClick={onSkipRest}
                variant="primary"
                className="flex-1 h-12 bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm md:text-base shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2"
              >
                <DumbbellIcon size={18} />
                Skip Rest & Start Set
              </Button>
              <Button
                onClick={() => onAddRestTime(30)}
                variant="secondary"
                className="h-12 px-4 text-amber-300 border-amber-800/50 bg-amber-950/30 hover:bg-amber-900/40 text-xs md:text-sm font-medium transition-all shrink-0"
              >
                +30s
              </Button>
            </>
          ) : (
            <Button
              onClick={onCompleteSet}
              variant="primary"
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm md:text-base shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
            >
              <FlameIcon size={18} />
              Complete Set {currentSet}
            </Button>
          )}
        </div>

        <div className="sm:col-span-1">
          {timer.isRunning ? (
            <Button
              onClick={() => onToggleTimer(false)}
              variant="secondary"
              className="w-full h-12 text-gray-300 hover:bg-gray-800 border-gray-700 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <PauseIcon size={18} />
              Pause
            </Button>
          ) : (
            timer.seconds > 0 && (
              <Button
                onClick={() => onToggleTimer(true)}
                variant="primary"
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <PlayIcon size={18} />
                Resume
              </Button>
            )
          )}
        </div>
      </div>
    </>
  );
}
