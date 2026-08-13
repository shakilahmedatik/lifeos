import { Globe, WifiOff } from "lucide-react";
import { isTauri } from "../../lib/dataSource.js";

interface OnlineOnlyBannerProps {
  moduleName: string;
}

export function OnlineOnlyBanner({ moduleName }: OnlineOnlyBannerProps) {
  const tauri = isTauri();

  return (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
      <div className="flex items-center gap-2.5">
        <Globe size={16} className="text-blue-400 shrink-0" />
        <div>
          <span className="font-semibold text-blue-200">{moduleName} is Online-Only</span>
          <p className="text-[11px] text-blue-300/80 mt-0.5">
            {tauri
              ? "This module connects directly to remote feeds via HTTP. Internet connection is required."
              : "This module fetches real-time updates directly from the server."}
          </p>
        </div>
      </div>
      {tauri && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200 font-mono text-[10px] uppercase tracking-wider shrink-0 border border-blue-500/30">
          <WifiOff size={10} /> Online Mode
        </span>
      )}
    </div>
  );
}
