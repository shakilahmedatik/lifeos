import { useCallback, useRef, useState } from "react";
import { ChartTooltip } from "./ChartTooltip.js";
import type { TooltipData } from "./types.js";

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
  formatValue?: (v: number) => string;
  showTooltip?: boolean;
  className?: string;
}

export function DonutChart({
  data,
  size = 160,
  innerRadius,
  outerRadius,
  formatValue = (v) => v.toLocaleString(),
  showTooltip = true,
  className = "",
}: DonutChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const cx = size / 2;
  const cy = size / 2;
  const r = outerRadius ?? size / 2 - 6;
  const ir = innerRadius ?? r * 0.68;
  const strokeWidth = r - ir;
  const total = data.reduce((sum, d) => sum + Math.max(0, d.value), 0);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, d: DonutSegment) => {
      if (!showTooltip || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        label: d.label,
        value: `${formatValue(d.value)} (${pct}%)`,
        color: d.color,
      });
    },
    [formatValue, total, showTooltip],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    setHoveredIndex(null);
  }, []);

  const activeSegments = data.filter((d) => d.value > 0);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Background Base Ring */}
        <circle
          cx={cx}
          cy={cy}
          r={(r + ir) / 2}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
          opacity={0.35}
        />

        {/* Multi-segment Arcs */}
        {total > 0 &&
          (() => {
            let cumulativeAngle = -90;
            return activeSegments.map((d, i) => {
              const fraction = d.value / total;
              const angle = fraction * 360;

              // If single full 100% segment, render with SVG circle stroke
              if (fraction >= 0.9999) {
                const midR = (r + ir) / 2;
                const circ = 2 * Math.PI * midR;
                return (
                  <circle
                    key={d.label}
                    cx={cx}
                    cy={cy}
                    r={midR}
                    fill="none"
                    stroke={d.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circ}
                    strokeDashoffset={0}
                    className="cursor-pointer transition-all duration-300"
                    opacity={hoveredIndex !== null && hoveredIndex !== i ? 0.6 : 1}
                    onMouseEnter={(e) => {
                      setHoveredIndex(i);
                      handleMouseEnter(e, d);
                    }}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              }

              const startAngle = cumulativeAngle;
              const endAngle = cumulativeAngle + angle;
              cumulativeAngle = endAngle;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;

              const x1 = cx + r * Math.cos(startRad);
              const y1 = cy + r * Math.sin(startRad);
              const x2 = cx + r * Math.cos(endRad);
              const y2 = cy + r * Math.sin(endRad);

              const ix1 = cx + ir * Math.cos(startRad);
              const iy1 = cy + ir * Math.sin(startRad);
              const ix2 = cx + ir * Math.cos(endRad);
              const iy2 = cy + ir * Math.sin(endRad);

              const largeArc = angle > 180 ? 1 : 0;

              const path = [
                `M ${x1} ${y1}`,
                `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
                `L ${ix2} ${iy2}`,
                `A ${ir} ${ir} 0 ${largeArc} 0 ${ix1} ${iy1}`,
                "Z",
              ].join(" ");

              return (
                <path
                  key={d.label}
                  d={path}
                  fill={d.color}
                  opacity={hoveredIndex !== null && hoveredIndex !== i ? 0.6 : 1}
                  className="cursor-pointer transition-opacity duration-200"
                  onMouseEnter={(e) => {
                    setHoveredIndex(i);
                    handleMouseEnter(e, d);
                  }}
                  onMouseLeave={handleMouseLeave}
                />
              );
            });
          })()}
      </svg>
      {tooltip && <ChartTooltip {...tooltip} />}
    </div>
  );
}
