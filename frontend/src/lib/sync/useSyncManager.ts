import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { isTauri } from "../dataSource.js";
import { syncEngine } from "./syncEngine.js";

export function useSyncManager() {
  const queryClient = useQueryClient();
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "error">("idle");
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitialSyncing, setIsInitialSyncing] = useState<boolean>(false);
  const initialSyncFired = useRef(false);

  const triggerSync = useCallback(async () => {
    if (!isTauri()) return;
    setSyncState("syncing");
    setErrorMessage(null);

    const isFirstTime = !initialSyncFired.current;
    if (isFirstTime) {
      setIsInitialSyncing(true);
      initialSyncFired.current = true;
    }

    try {
      const res = await syncEngine.sync();
      if (res.status === "success") {
        setSyncState("idle");
        setLastSyncAt(new Date().toLocaleTimeString());
        queryClient.invalidateQueries();
      } else if (res.status === "error") {
        setSyncState("error");
        setErrorMessage(res.error || "Sync failed");
      } else {
        setSyncState("idle");
      }
    } finally {
      if (isFirstTime) {
        setIsInitialSyncing(false);
      }
    }
  }, [queryClient]);

  // Sync on app launch
  useEffect(() => {
    if (!isTauri()) return;
    triggerSync();
  }, [triggerSync]);

  // Sync on window focus
  useEffect(() => {
    if (!isTauri()) return;
    const handleFocus = () => triggerSync();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [triggerSync]);

  return {
    isTauriMode: isTauri(),
    syncState,
    lastSyncAt,
    errorMessage,
    isInitialSyncing,
    triggerSync,
  };
}
