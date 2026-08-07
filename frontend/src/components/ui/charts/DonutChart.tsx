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
  const r = outerRadius ?? size / 2 - 4;
  const ir = innerRadius ?? r * 0.6;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, d: DonutSegment) => {
      if (!showTooltip || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        label: d.label,
        value: `${formatValue(d.value)} (${total > 0 ? Math.round((d.value / total) * 100) : 0}%)`,
        color: d.color,
      });
    },
    [formatValue, total, showTooltip],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    setHoveredIndex(null);
  }, []);

  if (data.length === 0 || total === 0) {
    return (
      <div
        className={`flex items-center justify-center text-muted text-xs ${className}`}
        style={{ width: size, height: size }}
      >
        No data
      </div>
    );
  }

  let cumulativeAngle = -90;

  const segments = data.map((d, i) => {
    const angle = (d.value / total) * 359.999;
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

    return { path, color: d.color, d, i };
  });

  return (
    <div className={`relative inline-block ${className}`}>
      <svg ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((s) => (
          <path
            key={s.i}
            d={s.path}
            fill={s.color}
            opacity={hoveredIndex !== null && hoveredIndex !== s.i ? 0.5 : 1}
            className="cursor-pointer transition-opacity"
            onMouseEnter={(e) => {
              setHoveredIndex(s.i);
              handleMouseEnter(e, s.d);
            }}
            onMouseLeave={handleMouseLeave}
          />
        ))}
      </svg>
      {tooltip && <ChartTooltip {...tooltip} />}
    </div>
  );
}
