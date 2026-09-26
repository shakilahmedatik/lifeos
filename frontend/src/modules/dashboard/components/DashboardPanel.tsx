import type { ReactNode } from "react";

export interface DashboardPanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function DashboardPanel({
  title,
  subtitle,
  children,
  className = "",
  action,
}: DashboardPanelProps) {
  return (
    <div
      className={`bg-card border border-border rounded-xl p-3.5 flex flex-col h-auto lg:h-full lg:min-h-0 overflow-visible lg:overflow-hidden shadow-sm hover:border-border-subtle transition-colors ${className}`}
    >
      <div className="flex items-start justify-between mb-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] sm:text-[11px] tracking-widest uppercase text-muted font-medium">
            {title}
          </span>
          {subtitle && (
            <span className="font-mono text-[9.5px] text-muted/60 lowercase">• {subtitle}</span>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="flex-1 min-h-0 relative flex flex-col justify-center">{children}</div>
    </div>
  );
}
