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
  height = 180,
  barRadius = 4,
  maxBarSize = 36,
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
    (e: React.MouseEvent<SVGElement>, d: ChartDataPoint, i: number) => {
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

  // Dynamic coordinate width proportional to data points
  const svgWidth = Math.max(500, data.length * 28);
  const chartWidth = svgWidth - PADDING.left - PADDING.right;
  const chartHeight = Math.max(height - PADDING.top - PADDING.bottom, 40);
  const slotWidth = chartWidth / data.length;
  const barWidth = Math.min(maxBarSize, Math.max(6, slotWidth - 6));

  const gridLines = 3;
  const gridStep = chartHeight / gridLines;

  // Smart label interval for month vs week
  const labelInterval = data.length <= 7 ? 1 : data.length <= 14 ? 2 : data.length <= 21 ? 3 : 5;

  return (
    <div className={`relative w-full ${className}`} style={{ minHeight: height }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgWidth} ${height}`}
        className="w-full h-full block overflow-visible"
        preserveAspectRatio="none"
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
                opacity={0.35}
              />
            );
          })}

        {showYAxis && (
          <>
            <text
              x={PADDING.left - 4}
              y={PADDING.top + 4}
              textAnchor="end"
              fill="var(--color-muted)"
              fontSize={10}
              fontFamily="monospace"
              dominantBaseline="middle"
            >
              {formatValue(maxValue)}
            </text>
            <text
              x={PADDING.left - 4}
              y={PADDING.top + chartHeight}
              textAnchor="end"
              fill="var(--color-muted)"
              fontSize={10}
              fontFamily="monospace"
              dominantBaseline="middle"
            >
              0
            </text>
          </>
        )}

        {data.map((d, i) => {
          const barHeight = maxValue > 0 ? (Math.max(0, d.value) / maxValue) * chartHeight : 0;
          const x = PADDING.left + i * slotWidth + (slotWidth - barWidth) / 2;
          const y = PADDING.top + chartHeight - barHeight;
          const fill = d.color ?? (d.value > 0 ? "var(--color-accent)" : "var(--color-border)");
          const isLabelVisible = showXAxis && (i % labelInterval === 0 || i === data.length - 1);

          return (
            <g
              key={d.label || i}
              className="cursor-pointer group"
              onMouseEnter={(e) => handleMouseEnter(e, d, i)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Background Track Bar */}
              <rect
                x={x}
                y={PADDING.top}
                width={barWidth}
                height={chartHeight}
                rx={barRadius}
                fill="var(--color-surface-elevated)"
                opacity={0.3}
                className="transition-opacity group-hover:opacity-60"
              />

              {/* Active Value Bar */}
              {barHeight > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={barRadius}
                  fill={fill}
                  className="transition-all duration-300 group-hover:brightness-110"
                />
              )}

              {/* X-axis Label */}
              {isLabelVisible && (
                <text
                  x={x + barWidth / 2}
                  y={PADDING.top + chartHeight + 16}
                  textAnchor="middle"
                  fill="var(--color-muted)"
                  fontSize={10}
                  fontFamily="sans-serif"
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
