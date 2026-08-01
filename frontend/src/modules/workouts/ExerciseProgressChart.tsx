import { Activity, X } from "lucide-react";
import { useMemo } from "react";
import Button from "../../components/ui/Button.js";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import { AreaChart } from "../../components/ui/charts/AreaChart.js";
import { useExerciseProgress } from "./useWorkouts.js";

interface ExerciseProgressChartProps {
  exerciseId: string;
  exerciseName: string;
  onClose?: () => void;
}

export function ExerciseProgressChart({
  exerciseId,
  exerciseName,
  onClose,
}: ExerciseProgressChartProps) {
  const { progress, loading, error } = useExerciseProgress(exerciseId);

  const { maxWeightOverall, totalSessions, avgRepsOverall, chartData } = useMemo(() => {
    if (!progress.length) {
      return { maxWeightOverall: 0, totalSessions: 0, avgRepsOverall: 0, chartData: [] };
    }

    let maxWeight = 0;
    let totalReps = 0;

    progress.forEach((p) => {
      if (p.maxWeight > maxWeight) maxWeight = p.maxWeight;
      totalReps += p.avgReps;
    });

    return {
      maxWeightOverall: maxWeight,
      totalSessions: progress.length,
      avgRepsOverall: Math.round(totalReps / progress.length),
      chartData: progress.map((p) => ({
        label: new Date(p.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        value: p.maxWeight,
      })),
    };
  }, [progress]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          {exerciseName} Progress
        </CardTitle>
        {onClose && (
          <Button variant="secondary" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-card-hover rounded-lg w-full"></div>
            <div className="flex gap-4">
              <div className="h-16 bg-card-hover rounded-lg flex-1"></div>
              <div className="h-16 bg-card-hover rounded-lg flex-1"></div>
              <div className="h-16 bg-card-hover rounded-lg flex-1"></div>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-danger/10 text-danger rounded-lg text-center">{error}</div>
        ) : progress.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center text-muted">
            <Activity className="w-12 h-12 mb-4 opacity-50" />
            <p>No data yet for this exercise.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AreaChart data={chartData} height={250} formatValue={(v) => `${v} kg`} />

            <div className="grid grid-cols-3 gap-4">
              <div className="glass p-4 rounded-xl text-center">
                <p className="text-xs text-muted uppercase tracking-wider mb-1">Max Weight</p>
                <p className="text-2xl font-bold text-accent">
                  {maxWeightOverall} <span className="text-sm font-normal text-muted">kg</span>
                </p>
              </div>
              <div className="glass p-4 rounded-xl text-center">
                <p className="text-xs text-muted uppercase tracking-wider mb-1">Sessions</p>
                <p className="text-2xl font-bold text-primary">{totalSessions}</p>
              </div>
              <div className="glass p-4 rounded-xl text-center">
                <p className="text-xs text-muted uppercase tracking-wider mb-1">Avg Reps</p>
                <p className="text-2xl font-bold text-primary">{avgRepsOverall}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
