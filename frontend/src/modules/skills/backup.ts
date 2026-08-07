import { api } from "../../lib/api";
import type { LearningBackup } from "./types";

const BACKUP_VERSION = "1.0.0";
const BACKUP_SCHEMA = "lifeos-learning-backup";

const STORAGE_KEY = "lifeos_last_backup_date";

export async function createBackup(): Promise<LearningBackup> {
  const [areas, resources, logs] = await Promise.all([
    api.getSkillAreas(),
    api.getLearningResources(),
    api.getLearningLogsByRange("2000-01-01", new Date().toISOString().split("T")[0]),
  ]);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    version: BACKUP_VERSION,
    schema: BACKUP_SCHEMA,
    data: {
      areas,
      resources,
      logs,
    },
  };
}

export async function exportBackup(): Promise<string> {
  const backup = await createBackup();
  return JSON.stringify(backup, null, 2);
}

export function downloadBackupjson(json: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lifeos-learning-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateBackup(data: unknown): data is LearningBackup {
  if (typeof data !== "object" || data === null) return false;
  const backup = data as Record<string, unknown>;
  return (
    typeof backup.id === "string" &&
    typeof backup.timestamp === "string" &&
    typeof backup.version === "string" &&
    typeof backup.schema === "string" &&
    backup.schema === BACKUP_SCHEMA &&
    typeof backup.data === "object" &&
    backup.data !== null &&
    Array.isArray((backup.data as Record<string, unknown>).areas) &&
    Array.isArray((backup.data as Record<string, unknown>).resources) &&
    Array.isArray((backup.data as Record<string, unknown>).logs)
  );
}

export async function importBackup(data: unknown): Promise<{ success: boolean; message: string }> {
  try {
    const backupData = typeof data === "string" ? JSON.parse(data) : data;
    if (!validateBackup(backupData)) {
      return { success: false, message: "Invalid backup file format" };
    }

    const result = await api.importBackup({
      areas: backupData.data.areas as import("@lifeos/contracts").NewSkillAreaInput[],
      resources: backupData.data
        .resources as import("@lifeos/contracts").NewLearningResourceInput[],
      logs: backupData.data.logs as import("@lifeos/contracts").NewLearningLogInput[],
    });

    return {
      success: true,
      message: `Imported ${result.areasCreated} areas, ${result.resourcesCreated} resources, ${result.logsCreated} logs from ${new Date(backupData.timestamp).toLocaleDateString()}`,
    };
  } catch {
    return { success: false, message: "Failed to parse backup file" };
  }
}

export function shouldShowBackupReminder(): boolean {
  const lastBackup = localStorage.getItem(STORAGE_KEY);
  if (!lastBackup) return true;
  const lastBackupDate = new Date(lastBackup);
  const daysSinceBackup = Math.floor(
    (Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  return daysSinceBackup >= 7;
}

export function markBackupCompleted(): void {
  localStorage.setItem(STORAGE_KEY, new Date().toISOString());
}
