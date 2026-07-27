import type Database from "better-sqlite3";
import { Router } from "express";

export function createHealthRouter(db: Database.Database): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    let dbOk = false;
    try {
      db.prepare("SELECT 1 AS alive").get();
      dbOk = true;
    } catch {
      dbOk = false;
    }

    const dbState = { open: db.open, readonly: db.readonly };

    const status = dbOk ? "ok" : "degraded";
    const code = dbOk ? 200 : 503;

    res.status(code).json({
      status,
      timestamp: new Date().toISOString(),
      db: dbState,
      uptime: process.uptime(),
    });
  });

  return router;
}
