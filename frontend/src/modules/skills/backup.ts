import { getCategories, getCourses, getSessions, saveToStorage } from "./storage";
import type { LearningBackup } from "./types";

const BACKUP_VERSION = "1.0.0";
const BACKUP_SCHEMA = "lifeos-learning-backup";

export function createBackup(): LearningBackup {
  const backup: LearningBackup = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    version: BACKUP_VERSION,
    schema: BACKUP_SCHEMA,
    data: {
      sessions: getSessions(),
      courses: getCourses(),
      categories: getCategories(),
    },
  };
  return backup;
}

export function exportBackup(): string {
  const backup = createBackup();
  return JSON.stringify(backup, null, 2);
}

export function downloadBackup(): void {
  const backupJson = exportBackup();
  const blob = new Blob([backupJson], { type: "application/json" });
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
    Array.isArray((backup.data as Record<string, unknown>).sessions) &&
    Array.isArray((backup.data as Record<string, unknown>).courses) &&
    Array.isArray((backup.data as Record<string, unknown>).categories)
  );
}

export function importBackup(json: string, merge = false): { success: boolean; message: string } {
  try {
    const data = JSON.parse(json);
    if (!validateBackup(data)) {
      return { success: false, message: "Invalid backup file format" };
    }

    if (merge) {
      // Merge with existing data
      const existingSessions = getSessions();
      const existingCourses = getCourses();
      const existingCategories = getCategories();

      const newSessions = data.data.sessions.filter(
        (s) => !existingSessions.some((es) => es.id === s.id),
      );
      const newCourses = data.data.courses.filter(
        (c) => !existingCourses.some((ec) => ec.id === c.id),
      );
      const newCategories = data.data.categories.filter(
        (c) => !existingCategories.some((ec) => ec.id === c.id),
      );

      saveToStorage("lifeos_learning_sessions", [...existingSessions, ...newSessions]);
      saveToStorage("lifeos_learning_courses", [...existingCourses, ...newCourses]);
      saveToStorage("lifeos_skill_categories", [...existingCategories, ...newCategories]);

      return {
        success: true,
        message: `Imported ${newSessions.length} sessions, ${newCourses.length} courses, ${newCategories.length} categories`,
      };
    }

    // Replace all data
    saveToStorage("lifeos_learning_sessions", data.data.sessions);
    saveToStorage("lifeos_learning_courses", data.data.courses);
    saveToStorage("lifeos_skill_categories", data.data.categories);

    return {
      success: true,
      message: `Replaced all data with backup from ${new Date(data.timestamp).toLocaleDateString()}`,
    };
  } catch {
    return { success: false, message: "Failed to parse backup file" };
  }
}

export function shouldShowBackupReminder(): boolean {
  const sessions = getSessions();
  const lastBackup = localStorage.getItem("lifeos_last_backup_date");

  // Show reminder after 10 sessions without backup
  if (sessions.length >= 10 && !lastBackup) {
    return true;
  }

  // Show reminder if last backup was more than 7 days ago
  if (lastBackup) {
    const lastBackupDate = new Date(lastBackup);
    const daysSinceBackup = Math.floor(
      (Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceBackup >= 7) {
      return true;
    }
  }

  return false;
}

export function markBackupCompleted(): void {
  localStorage.setItem("lifeos_last_backup_date", new Date().toISOString());
}
