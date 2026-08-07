import {
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import type { Client } from "@libsql/client";
import { Router } from "express";

const MAX_RESTORE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export function createBackupRouter(dbPath: string, client?: Client): Router {
  const router = Router();

  // GET /api/backup - Metadata snapshot
  router.get("/", (_req, res) => {
    try {
      if (process.env.DATABASE_URL) {
        res.json({
          provider: "Turso LibSQL",
          mode: "cloud-snapshots",
          message:
            "Backups are automatically managed via Turso cloud database point-in-time recovery & snapshots.",
          createdAt: new Date().toISOString(),
        });
        return;
      }

      const backupDir = resolve(process.cwd(), "data/backups");
      mkdirSync(backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `lifeos-backup-${timestamp}.sqlite`;
      const backupPath = join(backupDir, filename);

      copyFileSync(dbPath, backupPath);
      const stats = statSync(backupPath);

      res.json({
        filename,
        path: backupPath,
        sizeBytes: stats.size,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: `Backup failed: ${(err as Error).message}` });
    }
  });

  // GET /api/backup/export - User-isolated database JSON export download
  router.get("/export", async (req, res, next) => {
    try {
      const userId = (req as unknown as { user?: { id: string } }).user?.id || "default";

      let tasksData: unknown[] = [];
      let habitsData: unknown[] = [];
      let habitLogsData: unknown[] = [];
      let workoutsData: unknown[] = [];
      let workoutSessionsData: unknown[] = [];
      let accountsData: unknown[] = [];
      let transactionsData: unknown[] = [];
      let skillAreasData: unknown[] = [];
      let learningLogsData: unknown[] = [];
      let remindersData: unknown[] = [];
      let settingsData: unknown[] = [];

      if (client) {
        tasksData =
          (
            await client.execute({
              sql: "SELECT * FROM tasks WHERE user_id = ? OR user_id = '' OR user_id = 'default'",
              args: [userId],
            })
          ).rows || [];
        habitsData =
          (
            await client.execute({
              sql: "SELECT * FROM habits WHERE user_id = ? OR user_id = '' OR user_id = 'default'",
              args: [userId],
            })
          ).rows || [];
        habitLogsData =
          (
            await client.execute({
              sql: "SELECT * FROM habit_logs WHERE user_id = ? OR user_id = '' OR user_id = 'default'",
              args: [userId],
            })
          ).rows || [];
        workoutsData =
          (
            await client.execute({
              sql: "SELECT * FROM workouts WHERE user_id = ? OR user_id = '' OR user_id = 'default'",
              args: [userId],
            })
          ).rows || [];
        workoutSessionsData =
          (
            await client.execute({
              sql: "SELECT * FROM workout_sessions WHERE user_id = ? OR user_id = '' OR user_id = 'default'",
              args: [userId],
            })
          ).rows || [];
        accountsData =
          (
            await client.execute({
              sql: "SELECT * FROM accounts WHERE user_id = ? OR user_id = '' OR user_id = 'default'",
              args: [userId],
            })
          ).rows || [];
        transactionsData =
          (
            await client.execute({
              sql: "SELECT * FROM transactions WHERE user_id = ? OR user_id = '' OR user_id = 'default'",
              args: [userId],
            })
          ).rows || [];
        skillAreasData =
          (
            await client.execute({
              sql: "SELECT * FROM skill_areas WHERE user_id = ? OR user_id = '' OR user_id = 'default'",
              args: [userId],
            })
          ).rows || [];
        learningLogsData =
          (
            await client.execute({
              sql: "SELECT * FROM learning_logs WHERE user_id = ? OR user_id = '' OR user_id = 'default'",
              args: [userId],
            })
          ).rows || [];
        remindersData =
          (
            await client.execute({
              sql: "SELECT * FROM reminders WHERE user_id = ? OR user_id = '' OR user_id = 'default'",
              args: [userId],
            })
          ).rows || [];
        settingsData = (await client.execute("SELECT * FROM settings")).rows || [];
      }

      const exportData = {
        version: "1.0",
        appName: "LifeOS",
        userId,
        exportedAt: new Date().toISOString(),
        tables: {
          tasks: tasksData,
          habits: habitsData,
          habitLogs: habitLogsData,
          workouts: workoutsData,
          workoutSessions: workoutSessionsData,
          accounts: accountsData,
          transactions: transactionsData,
          skillAreas: skillAreasData,
          learningLogs: learningLogsData,
          reminders: remindersData,
          settings: settingsData,
        },
      };

      const dateStr = new Date().toISOString().split("T")[0];
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="lifeos-backup-${dateStr}.json"`);
      res.send(JSON.stringify(exportData, null, 2));
    } catch (err) {
      next(err);
    }
  });

  // GET /api/backup/download - Binary SQLite file download
  router.get("/download", (_req, res) => {
    try {
      if (existsSync(dbPath)) {
        const dateStr = new Date().toISOString().split("T")[0];
        res.download(dbPath, `lifeos-backup-${dateStr}.sqlite`);
      } else {
        res.status(404).json({ error: "Database file not found for direct download" });
      }
    } catch (err) {
      res.status(500).json({ error: `Download failed: ${(err as Error).message}` });
    }
  });

  // POST /api/backup/restore - Restore DB
  router.post("/restore", (req, res) => {
    try {
      if (process.env.DATABASE_URL) {
        res.status(400).json({
          error:
            "Direct binary SQLite restore is disabled when using Turso LibSQL. Use Turso Cloud dashboard or CLI tools to restore database snapshots.",
        });
        return;
      }

      const backupDir = resolve(process.cwd(), "data/backups");
      mkdirSync(backupDir, { recursive: true });
      const tempPath = join(backupDir, `temp-restore-${Date.now()}.sqlite`);
      const preRestoreBackup = join(backupDir, `pre-restore-${Date.now()}.sqlite`);

      const cleanupTemp = () => {
        if (existsSync(tempPath)) {
          try {
            unlinkSync(tempPath);
          } catch {
            // ignore cleanup errors
          }
        }
      };

      if (req.body && Buffer.isBuffer(req.body)) {
        if (req.body.length > MAX_RESTORE_SIZE_BYTES) {
          res.status(413).json({ error: "Backup file exceeds maximum size limit (100MB)" });
          return;
        }
        copyFileSync(dbPath, preRestoreBackup);
        writeFileSync(dbPath, req.body);
        res.json({
          message: "Database restored successfully.",
          safetyBackup: preRestoreBackup,
        });
        return;
      }

      let bytesReceived = 0;
      let isAborted = false;
      const writeStream = createWriteStream(tempPath);

      req.on("data", (chunk: Buffer) => {
        bytesReceived += chunk.length;
        if (bytesReceived > MAX_RESTORE_SIZE_BYTES && !isAborted) {
          isAborted = true;
          req.destroy();
          writeStream.destroy();
          cleanupTemp();
          res.status(413).json({ error: "Backup file exceeds maximum size limit (100MB)" });
        }
      });

      req.pipe(writeStream);

      writeStream.on("finish", () => {
        if (isAborted) return;
        if (bytesReceived === 0) {
          cleanupTemp();
          res.status(400).json({ error: "Request body must be the SQLite file content" });
          return;
        }
        try {
          copyFileSync(dbPath, preRestoreBackup);
          copyFileSync(tempPath, dbPath);
          cleanupTemp();
          res.json({
            message: "Database restored successfully.",
            safetyBackup: preRestoreBackup,
          });
        } catch (err) {
          cleanupTemp();
          res.status(500).json({ error: `Restore failed: ${(err as Error).message}` });
        }
      });

      writeStream.on("error", (err) => {
        cleanupTemp();
        if (!isAborted) {
          res.status(500).json({ error: `Restore stream error: ${err.message}` });
        }
      });
    } catch (err) {
      res.status(500).json({ error: `Restore failed: ${(err as Error).message}` });
    }
  });

  return router;
}
