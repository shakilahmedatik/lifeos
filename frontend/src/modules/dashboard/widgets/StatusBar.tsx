import { RefreshCw, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

interface StatusBarProps {
  loading: boolean;
  onRefresh: () => void;
}

export function StatusBar({ loading, onRefresh }: StatusBarProps) {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="flex items-center justify-between mb-1 shrink-0 px-1">
      <div>
        <h1 className="text-gray-100 text-lg font-semibold tracking-tight leading-tight">
          {dateStr}
        </h1>
        <div className="font-mono text-xs text-muted tabular-nums">{timeStr}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Status: Live <Wifi size={11} className="ml-0.5" />
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 border border-border bg-card-solid hover:bg-card-hover rounded-lg px-3 py-1.5 text-secondary hover:text-primary transition-all font-mono text-xs disabled:opacity-50 active:scale-95"
        >
          <RefreshCw size={12} className={loading ? "animate-spin text-accent" : ""} />
          Refresh
        </button>
      </div>
    </div>
  );
}
