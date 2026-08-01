import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  lineWidth?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = "var(--color-accent)",
  showDots = false,
  lineWidth = 1.5,
  className = "",
}: SparklineProps) {
  const coords = useMemo(() => {
    if (data.length === 0) return [];

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const pad = 2;

    return data.map((v, i) => ({
      x: pad + (i / Math.max(data.length - 1, 1)) * (width - pad * 2),
      y: pad + (1 - (v - min) / range) * (height - pad * 2),
    }));
  }, [data, width, height]);

  if (data.length === 0) {
    return (
      <svg width={width} height={height} className={className}>
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

  const pathD = coords.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg width={width} height={height} className={className}>
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={lineWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {showDots && coords.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={1.5} fill={color} />)}
    </svg>
  );
}
