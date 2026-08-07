import { useCallback, useRef, useState } from "react";
import { ChartTooltip } from "./ChartTooltip.js";
import type { ChartDataPoint, TooltipData } from "./types.js";

interface HorizontalBarChartProps {
  data: ChartDataPoint[];
  height?: number;
  barHeight?: number;
  labelWidth?: number;
  showValue?: boolean;
  formatValue?: (v: number) => string;
  className?: string;
}

const DEFAULT_COLORS = [
  "var(--color-accent)",
  "var(--color-success)",
  "var(--color-danger)",
  "var(--color-warning)",
  "var(--color-primary)",
  "var(--color-secondary)",
];

export function HorizontalBarChart({
  data,
  height,
  barHeight = 18,
  labelWidth = 80,
  showValue = true,
  formatValue = (v) => v.toLocaleString(),
  className = "",
}: HorizontalBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const computedHeight = height ?? data.length * (barHeight + 8) + 16;
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<SVGRectElement>, d: ChartDataPoint, i: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        label: d.label,
        value: formatValue(d.value),
        color: d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      });
    },
    [formatValue],
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-muted text-xs ${className}`}
        style={{ height: computedHeight }}
      >
        No data
      </div>
    );
  }

  const svgWidth = 300;
  const barAreaWidth = svgWidth - labelWidth - 10;
  const gap = 8;

  return (
    <div className={`relative ${className}`} style={{ height: computedHeight }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgWidth} ${computedHeight}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {data.map((d, i) => {
          const fill = d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
          const barW = (d.value / maxValue) * barAreaWidth;
          const y = 8 + i * (barHeight + gap);

          return (
            <g key={i}>
              <text
                x={labelWidth - 4}
                y={y + barHeight / 2}
                textAnchor="end"
                fill="var(--color-muted)"
                fontSize={10}
                dominantBaseline="middle"
              >
                {d.label.length > 10 ? `${d.label.slice(0, 10)}...` : d.label}
              </text>
              <rect
                x={labelWidth}
                y={y}
                width={barAreaWidth}
                height={barHeight}
                rx={4}
                fill="var(--color-border)"
                opacity={0.3}
              />
              <rect
                x={labelWidth}
                y={y}
                width={Math.max(barW, 2)}
                height={barHeight}
                rx={4}
                fill={fill}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onMouseEnter={(e) => handleMouseEnter(e, d, i)}
                onMouseLeave={handleMouseLeave}
              />
              {showValue && (
                <text
                  x={labelWidth + barW + 6}
                  y={y + barHeight / 2}
                  fill="var(--color-muted)"
                  fontSize={10}
                  dominantBaseline="middle"
                >
                  {formatValue(d.value)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {tooltip && <ChartTooltip {...tooltip} />}
    </div>
  );
}
