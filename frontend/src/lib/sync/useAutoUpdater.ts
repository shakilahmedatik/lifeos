import { check } from "@tauri-apps/plugin-updater";
import { useEffect, useState } from "react";
import { useAppToast } from "../../components/Toast.js";
import { isTauri } from "../dataSource.js";

export function useAutoUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useAppToast();

  useEffect(() => {
    if (!isTauri()) return;

    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update?.available) {
          setUpdateAvailable(true);
          setNewVersion(update.version);
          toast.success(`New LifeOS Desktop update v${update.version} available!`);
        }
      } catch {
        // Updater check silent fallback in offline/dev mode
      }
    };

    checkForUpdates();
  }, [toast]);

  const installUpdate = async () => {
    if (!isTauri()) return;
    setIsUpdating(true);
    try {
      const update = await check();
      if (update?.available) {
        toast.success("Downloading and installing update...");
        await update.downloadAndInstall();
        toast.success("Update installed! Relaunching app...");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to install update");
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isTauriMode: isTauri(),
    updateAvailable,
    newVersion,
    isUpdating,
    installUpdate,
  };
}
