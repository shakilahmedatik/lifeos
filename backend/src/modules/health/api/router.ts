import type { Client } from "@libsql/client";
import { Router } from "express";

export interface SchedulerStatus {
  name: string;
  status: "idle" | "running" | "error";
  lastRun?: string;
  error?: string;
}

export function createHealthRouter(
  client: Client,
  getSchedulerStatus?: () => SchedulerStatus[],
): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    let dbOk = false;
    try {
      await client.execute("SELECT 1 AS alive");
      dbOk = true;
    } catch {
      dbOk = false;
    }

    const dbState = { open: true, readonly: false };

    const status = dbOk ? "ok" : "degraded";
    const code = dbOk ? 200 : 503;

    res.status(code).json({
      status,
      timestamp: new Date().toISOString(),
      db: dbState,
      schedulers: getSchedulerStatus ? getSchedulerStatus() : [],
      uptime: process.uptime(),
    });
  });

  router.get("/openapi.json", (_req, res) => {
    res.json({
      openapi: "3.0.3",
      info: {
        title: "LifeOS API",
        version: "1.0.0",
        description: "Personal productivity and life management system API",
      },
      paths: {
        "/api/health": {
          get: { summary: "System health check endpoint" },
        },
        "/api/routine/tasks": {
          get: { summary: "List tasks by date" },
          post: { summary: "Create a new time-blocked task" },
        },
        "/api/habits": {
          get: { summary: "List habits" },
          post: { summary: "Create habit" },
        },
        "/api/finance/transactions": {
          get: { summary: "List transactions" },
          post: { summary: "Create transaction" },
        },
      },
    });
  });

  return router;
}
