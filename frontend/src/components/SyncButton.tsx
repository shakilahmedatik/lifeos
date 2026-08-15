import { Download, RefreshCw } from "lucide-react";
import { useAutoUpdater } from "../lib/sync/useAutoUpdater.js";
import { useSyncManager } from "../lib/sync/useSyncManager.js";

export function SyncButton({ compact = false }: { compact?: boolean }) {
  const { isTauriMode, syncState, lastSyncAt, errorMessage, triggerSync } = useSyncManager();
  const { updateAvailable, newVersion, isUpdating, installUpdate } = useAutoUpdater();

  if (!isTauriMode) return null;

  return (
    <div className={`flex items-center gap-2 ${compact ? "flex-col" : ""}`}>
      {updateAvailable && (
        <button
          type="button"
          onClick={installUpdate}
          disabled={isUpdating}
          className="flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors animate-pulse w-full"
          title={`Update v${newVersion} available. Click to install.`}
        >
          <Download size={13} className={isUpdating ? "animate-bounce" : ""} />
          {!compact && <span>{isUpdating ? "Installing..." : `Update v${newVersion}`}</span>}
        </button>
      )}

      <button
        type="button"
        onClick={triggerSync}
        disabled={syncState === "syncing"}
        className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors w-full ${
          syncState === "error"
            ? "bg-red-500/20 text-red-300 border-red-500/40"
            : syncState === "syncing"
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
              : "bg-surface-elevated text-secondary border-border hover:bg-card-hover"
        }`}
        title={
          errorMessage
            ? `Sync error: ${errorMessage}`
            : lastSyncAt
              ? `Last synced at ${lastSyncAt}`
              : "Click to sync"
        }
      >
        <RefreshCw
          size={13}
          className={syncState === "syncing" ? "animate-spin shrink-0" : "shrink-0"}
        />
        {!compact && (
          <span>
            {syncState === "syncing" ? "Syncing..." : syncState === "error" ? "Sync Error" : "Sync"}
          </span>
        )}
      </button>
    </div>
  );
}
