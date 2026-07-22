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

  return router;
}
