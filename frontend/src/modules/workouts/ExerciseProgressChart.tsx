import { useMemo } from "react";
import Button from "../../components/ui/Button.js";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import { ActivityIcon, XIcon } from "../../components/ui/icons.js";
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

  const { maxWeightOverall, totalSessions, avgRepsOverall } = useMemo(() => {
    if (!progress.length) return { maxWeightOverall: 0, totalSessions: 0, avgRepsOverall: 0 };

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
    };
  }, [progress]);

  // Determine chart dimensions & scaling
  const width = 600;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = useMemo(() => {
    if (!progress.length) return [];

    const maxWeight = Math.max(...progress.map((p) => p.maxWeight), 1);
    const minWeight = Math.min(...progress.map((p) => p.maxWeight), 0) * 0.8;

    return progress.map((p, i) => {
      const x = (i / Math.max(progress.length - 1, 1)) * chartWidth;
      const y =
        chartHeight -
        ((p.maxWeight - minWeight) / Math.max(maxWeight - minWeight, 1)) * chartHeight;
      return { ...p, x, y };
    });
  }, [progress, chartWidth, chartHeight]);

  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M 0,${points[0].y} L ${chartWidth},${points[0].y}`;

    return points.reduce((acc, point, i, arr) => {
      if (i === 0) return `M ${point.x},${point.y}`;

      const prev = arr[i - 1];
      const cp1x = prev.x + (point.x - prev.x) / 3;
      const cp1y = prev.y;
      const cp2x = point.x - (point.x - prev.x) / 3;
      const cp2y = point.y;

      return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`;
    }, "");
  }, [points, chartWidth]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl flex items-center gap-2">
          <ActivityIcon className="w-5 h-5 text-emerald-400" />
          {exerciseName} Progress
        </CardTitle>
        {onClose && (
          <Button variant="secondary" onClick={onClose}>
            <XIcon className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-700/50 rounded-lg w-full"></div>
            <div className="flex gap-4">
              <div className="h-16 bg-gray-700/50 rounded-lg flex-1"></div>
              <div className="h-16 bg-gray-700/50 rounded-lg flex-1"></div>
              <div className="h-16 bg-gray-700/50 rounded-lg flex-1"></div>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 text-red-400 rounded-lg text-center">{error}</div>
        ) : progress.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center text-gray-500">
            <ActivityIcon className="w-12 h-12 mb-4 opacity-50" />
            <p>No data yet for this exercise.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div
              className="relative w-full overflow-x-auto overflow-y-hidden"
              style={{ minHeight: `${height}px` }}
            >
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full min-w-125"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <g transform={`translate(${padding.left}, ${padding.top})`}>
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = chartHeight * ratio;
                    const val =
                      Math.max(...progress.map((p) => p.maxWeight)) -
                      Math.max(...progress.map((p) => p.maxWeight)) * ratio;
                    return (
                      <g key={ratio} className="text-gray-600">
                        <line
                          x1="0"
                          y1={y}
                          x2={chartWidth}
                          y2={y}
                          stroke="currentColor"
                          strokeDasharray="4 4"
                          strokeOpacity="0.3"
                        />
                        <text
                          x="-10"
                          y={y + 4}
                          fill="currentColor"
                          fontSize="10"
                          textAnchor="end"
                          className="text-gray-400"
                        >
                          {val.toFixed(0)}kg
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  <path
                    d={`${linePath} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`}
                    fill="url(#area-gradient)"
                  />

                  {/* Main line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="url(#line-gradient)"
                    strokeWidth="3"
                    className="drop-shadow-lg"
                  />

                  {/* Points */}
                  {points.map((p) => (
                    <g key={`point-${p.sessionId}`} className="group transition-all duration-300">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill="#1f2937"
                        stroke="#10b981"
                        strokeWidth="2"
                        className="transition-all duration-300 group-hover:r-6 group-hover:fill-emerald-400"
                      />
                      {/* Tooltip on hover (CSS implementation) */}
                      <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <rect
                          x={p.x - 40}
                          y={p.y - 40}
                          width="80"
                          height="30"
                          rx="4"
                          fill="#374151"
                        />
                        <text x={p.x} y={p.y - 20} fill="#f3f4f6" fontSize="12" textAnchor="middle">
                          {p.maxWeight}kg
                        </text>
                      </g>
                    </g>
                  ))}

                  {/* X Axis labels */}
                  {points.map((p, i) => {
                    // Only show 5 max labels to avoid crowding
                    const step = Math.max(1, Math.floor(points.length / 5));
                    if (i % step === 0 || i === points.length - 1) {
                      const date = new Date(p.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      });
                      return (
                        <text
                          key={`label-${p.sessionId}`}
                          x={p.x}
                          y={chartHeight + 20}
                          fill="currentColor"
                          fontSize="10"
                          textAnchor="middle"
                          className="text-gray-400"
                        >
                          {date}
                        </text>
                      );
                    }
                    return null;
                  })}
                </g>
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Max Weight</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {maxWeightOverall} <span className="text-sm font-normal text-gray-400">kg</span>
                </p>
              </div>
              <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sessions</p>
                <p className="text-2xl font-bold text-blue-400">{totalSessions}</p>
              </div>
              <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Avg Reps</p>
                <p className="text-2xl font-bold text-amber-400">{avgRepsOverall}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
