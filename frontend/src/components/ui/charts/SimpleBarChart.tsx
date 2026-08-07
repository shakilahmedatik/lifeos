import { useCallback, useRef, useState } from "react";
import { ChartTooltip } from "./ChartTooltip.js";
import type { ChartDataPoint, TooltipData } from "./types.js";

interface SimpleBarChartProps {
  data: ChartDataPoint[];
  height?: number;
  barRadius?: number;
  maxBarSize?: number;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  formatValue?: (v: number) => string;
  formatLabel?: (l: string) => string;
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

const DEFAULT_PADDING = { top: 10, right: 10, bottom: 24, left: 10 };

export function SimpleBarChart({
  data,
  height = 160,
  barRadius = 4,
  maxBarSize = 40,
  showGrid = true,
  showXAxis = true,
  showYAxis = false,
  formatValue = (v) => v.toLocaleString(),
  formatLabel = (l) => l,
  className = "",
}: SimpleBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const PADDING = { ...DEFAULT_PADDING, left: showYAxis ? 40 : DEFAULT_PADDING.left };

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
        style={{ height }}
      >
        No data
      </div>
    );
  }

  const svgWidth = 300;
  const chartWidth = svgWidth - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;
  const barWidth = Math.min(maxBarSize, Math.floor(chartWidth / data.length) - 4);
  const totalBarsWidth = data.length * (barWidth + 4) - 4;
  const offsetX = PADDING.left + (chartWidth - totalBarsWidth) / 2;

  const gridLines = 4;
  const gridStep = chartHeight / gridLines;

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgWidth} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {showGrid &&
          Array.from({ length: gridLines + 1 }, (_, i) => {
            const y = PADDING.top + i * gridStep;
            return (
              <line
                key={`grid-${i}`}
                x1={PADDING.left}
                y1={y}
                x2={svgWidth - PADDING.right}
                y2={y}
                stroke="var(--color-border)"
                strokeDasharray="3 3"
                opacity={0.5}
              />
            );
          })}

        {showYAxis && (
          <>
            <text
              x={PADDING.left - 2}
              y={PADDING.top}
              textAnchor="end"
              fill="var(--color-muted)"
              fontSize={9}
              dominantBaseline="middle"
            >
              {formatValue(maxValue)}
            </text>
            <text
              x={PADDING.left - 2}
              y={PADDING.top + chartHeight}
              textAnchor="end"
              fill="var(--color-muted)"
              fontSize={9}
              dominantBaseline="middle"
            >
              0
            </text>
          </>
        )}

        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * chartHeight;
          const x = offsetX + i * (barWidth + 4);
          const y = PADDING.top + chartHeight - barHeight;
          const fill = d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={barRadius}
                fill={fill}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onMouseEnter={(e) => handleMouseEnter(e, d, i)}
                onMouseLeave={handleMouseLeave}
              />
              {showXAxis && (
                <text
                  x={x + barWidth / 2}
                  y={PADDING.top + chartHeight + 14}
                  textAnchor="middle"
                  fill="var(--color-muted)"
                  fontSize={10}
                >
                  {formatLabel(d.label)}
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
