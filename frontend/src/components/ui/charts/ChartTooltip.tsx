import type { TooltipData } from "./types.js";

export function ChartTooltip({ x, y, label, value, color }: TooltipData) {
  return (
    <div
      className="pointer-events-none absolute z-50 px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-xs shadow-lg"
      style={{ left: x, top: y - 8, transform: "translate(-50%, -100%)" }}
    >
      <p className="font-semibold text-primary whitespace-nowrap">{label}</p>
      <p className="whitespace-nowrap" style={{ color: color ?? "var(--color-accent)" }}>
        {value}
      </p>
    </div>
  );
}
