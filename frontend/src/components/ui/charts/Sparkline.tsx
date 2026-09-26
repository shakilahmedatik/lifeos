import { useId, useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  fillArea?: boolean;
  lineWidth?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = "var(--color-accent)",
  showDots = false,
  fillArea = true,
  lineWidth = 2,
  className = "",
}: SparklineProps) {
  const gradientId = useId();

  const coords = useMemo(() => {
    if (data.length === 0) return [];

    const pad = 2;
    // For percentages, normalize against 100
    const maxVal = Math.max(...data);
    const max = maxVal > 10 ? 100 : Math.max(maxVal, 1);
    const min = 0;
    const range = max - min || 1;

    return data.map((v, i) => ({
      x: pad + (i / Math.max(data.length - 1, 1)) * (width - pad * 2),
      y: pad + (1 - Math.max(0, Math.min(max, v) - min) / range) * (height - pad * 2),
    }));
  }, [data, width, height]);

  if (data.length === 0) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none">
        <line
          x1={2}
          y1={height / 2}
          x2={width - 2}
          y2={height / 2}
          stroke="var(--color-border)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      </svg>
    );
  }

  const pathD = coords
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaD = `${pathD} L ${coords[coords.length - 1].x.toFixed(1)} ${height} L ${coords[0].x.toFixed(1)} ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none">
      {fillArea && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
      )}

      {fillArea && <path d={areaD} fill={`url(#${gradientId})`} />}

      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={lineWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {showDots &&
        coords.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={2}
            fill={color}
            stroke="var(--color-surface)"
            strokeWidth={1}
          />
        ))}
    </svg>
  );
}
