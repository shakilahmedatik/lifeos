import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { Router } from "express";

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
      const backupDir = resolve(process.cwd(), "data/backups");
      mkdirSync(backupDir, { recursive: true });
      const preRestoreBackup = join(backupDir, `pre-restore-${Date.now()}.sqlite`);
      copyFileSync(dbPath, preRestoreBackup);

      if (req.body && Buffer.isBuffer(req.body)) {
        copyFileSync(req.body.toString(), dbPath);
      }
      res.json({
        message: "Database restore initialized successfully.",
        safetyBackup: preRestoreBackup,
      });
    } catch (err) {
      res.status(500).json({ error: `Restore failed: ${(err as Error).message}` });
    }
  });

  return router;
}
