import { useCallback, useId, useMemo, useRef, useState } from "react";
import { ChartTooltip } from "./ChartTooltip.js";
import type { TooltipData } from "./types.js";

interface AreaChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  gradientOpacity?: number;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  strokeWidth?: number;
  formatValue?: (v: number) => string;
  className?: string;
}

const DEFAULT_PADDING = { top: 10, right: 10, bottom: 24, left: 10 };

export function AreaChart({
  data,
  height = 160,
  color = "var(--color-accent)",
  gradientOpacity = 0.3,
  showGrid = true,
  showXAxis = true,
  showYAxis = false,
  strokeWidth = 2.5,
  formatValue = (v) => v.toLocaleString(),
  className = "",
}: AreaChartProps) {
  const instanceId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const PADDING = useMemo(
    () => ({ ...DEFAULT_PADDING, left: showYAxis ? 40 : DEFAULT_PADDING.left }),
    [showYAxis],
  );

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = 0;

  const points = useMemo(() => {
    if (data.length === 0) return [];

    const svgWidth = 300;
    const chartWidth = svgWidth - PADDING.left - PADDING.right;
    const chartHeight = height - PADDING.top - PADDING.bottom;
    const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth / 2;

    return data.map((d, i) => ({
      x: PADDING.left + (data.length > 1 ? i * stepX : chartWidth / 2),
      y: PADDING.top + chartHeight - ((d.value - minValue) / (maxValue - minValue)) * chartHeight,
      ...d,
    }));
  }, [data, height, maxValue, PADDING]);

  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const chartHeight = height - PADDING.top - PADDING.bottom;
    const bottom = PADDING.top + chartHeight;

    const linePart = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    return `${linePart} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`;
  }, [points, height, PADDING]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, i: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      setHoveredIndex(i);
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        label: data[i].label,
        value: formatValue(data[i].value),
        color,
      });
    },
    [data, formatValue, color],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    setHoveredIndex(null);
  }, []);

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
  const chartHeight = height - PADDING.top - PADDING.bottom;
  const gridLines = 4;
  const gridStep = chartHeight / gridLines;
  const gradientId = `area-gradient-${instanceId.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgWidth} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={gradientOpacity} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

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

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredIndex === i ? 5 : 0}
            fill={color}
            stroke="var(--color-surface)"
            strokeWidth={2}
            className="pointer-events-none"
          />
        ))}

        {showXAxis &&
          points.map((p, i) => (
            <text
              key={`label-${i}`}
              x={p.x}
              y={PADDING.top + chartHeight + 14}
              textAnchor="middle"
              fill="var(--color-muted)"
              fontSize={9}
            >
              {p.label.length > 5 ? `${p.label.slice(0, 5)}...` : p.label}
            </text>
          ))}

        {points.map((p, i) => (
          <rect
            key={`hit-${i}`}
            x={p.x - 10}
            y={PADDING.top}
            width={20}
            height={chartHeight}
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={(e) => handleMouseEnter(e, i)}
            onMouseLeave={handleMouseLeave}
          />
        ))}
      </svg>
      {tooltip && <ChartTooltip {...tooltip} />}
    </div>
  );
}
