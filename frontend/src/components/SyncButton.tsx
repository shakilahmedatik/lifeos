import { RefreshCw } from "lucide-react";
import { useSyncManager } from "../lib/sync/useSyncManager.js";

export function SyncButton() {
  const { isTauriMode, syncState, lastSyncAt, errorMessage, triggerSync } = useSyncManager();

  if (!isTauriMode) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={triggerSync}
        disabled={syncState === "syncing"}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
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
        <RefreshCw size={13} className={syncState === "syncing" ? "animate-spin" : ""} />
        <span>
          {syncState === "syncing" ? "Syncing..." : syncState === "error" ? "Sync Error" : "Sync"}
        </span>
      </button>
    </div>
  );
}
