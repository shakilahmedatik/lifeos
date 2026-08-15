import { Globe, WifiOff } from "lucide-react";
import { isTauri } from "../../lib/dataSource.js";

interface OnlineOnlyBannerProps {
  moduleName: string;
}

export function OnlineOnlyBanner({ moduleName }: OnlineOnlyBannerProps) {
  const tauri = isTauri();

  if (!tauri) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs shadow-sm shadow-black/5 animate-fade-in">
      <div className="flex items-center gap-2">
        <Globe size={14} className="text-blue-400 shrink-0" />
        <span className="font-medium text-blue-200">
          <span className="font-semibold">{moduleName}</span> requires an active internet
          connection.
        </span>
      </div>
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-blue-300/80 font-mono text-[9px] uppercase tracking-wider shrink-0 bg-blue-500/10">
        <WifiOff size={10} /> Online Mode
      </span>
    </div>
  );
}
