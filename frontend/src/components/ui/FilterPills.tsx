import { cn } from "../../lib/utils.js";

interface FilterPillsProps {
  options: string[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterPills({ options, active, onChange, className }: FilterPillsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 scrollbar-none",
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
            active === opt
              ? "bg-accent border-accent text-slate-950 shadow-sm"
              : "bg-surface border-border text-muted hover:text-primary hover:border-border-subtle",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
