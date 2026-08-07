import type { Client } from "@libsql/client";
import { Router } from "express";

export function createSettingsRouter(client: Client): Router {
  const router = Router();

  // GET /api/settings
  router.get("/", async (_req, res, next) => {
    try {
      const result = await client.execute("SELECT key, value FROM settings");
      const settings: Record<string, string> = {};
      for (const row of result.rows) {
        if (row.key && typeof row.key === "string") {
          settings[row.key] = String(row.value ?? "");
        }
      }
      res.json(settings);
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/settings
  router.patch("/", async (req, res, next) => {
    try {
      const updates = req.body;
      if (!updates || typeof updates !== "object") {
        res.status(400).json({ error: "Invalid settings object" });
        return;
      }

      const now = new Date().toISOString();
      for (const [key, val] of Object.entries(updates)) {
        if (typeof key === "string" && key.trim().length > 0) {
          const stringVal = typeof val === "string" ? val : JSON.stringify(val);
          await client.execute({
            sql: `
              INSERT INTO settings (key, value, updated_at)
              VALUES (?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
            `,
            args: [key, stringVal, now],
          });
        }
      }

      const result = await client.execute("SELECT key, value FROM settings");
      const settings: Record<string, string> = {};
      for (const row of result.rows) {
        if (row.key && typeof row.key === "string") {
          settings[row.key] = String(row.value ?? "");
        }
      }
      res.json(settings);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
