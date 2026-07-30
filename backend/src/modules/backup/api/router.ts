import { copyFileSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Router } from "express";

const MAX_RESTORE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export function createBackupRouter(dbPath: string): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    try {
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
      if (!req.body || !Buffer.isBuffer(req.body)) {
        res.status(400).json({ error: "Request body must be the SQLite file content" });
        return;
      }

      if (req.body.length > MAX_RESTORE_SIZE_BYTES) {
        res.status(413).json({ error: "Backup file exceeds maximum size limit (100MB)" });
        return;
      }

      const backupDir = resolve(process.cwd(), "data/backups");
      mkdirSync(backupDir, { recursive: true });
      const preRestoreBackup = join(backupDir, `pre-restore-${Date.now()}.sqlite`);
      copyFileSync(dbPath, preRestoreBackup);

      writeFileSync(dbPath, req.body);

      res.json({
        message: "Database restored successfully.",
        safetyBackup: preRestoreBackup,
      });
    } catch (err) {
      res.status(500).json({ error: `Restore failed: ${(err as Error).message}` });
    }
  });

  return router;
}
