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
import { Router } from "express";

const MAX_RESTORE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export function createBackupRouter(dbPath: string): Router {
  const router = Router();

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

      // Stream handling for raw binary stream to avoid buffering 100MB in RAM
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
