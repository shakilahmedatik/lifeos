import { eq } from "drizzle-orm";
import { Router } from "express";
import type { DrizzleClient } from "../../shared/db.js";
import { settings } from "../../shared/schema.js";
import type { AuthenticatedRequest } from "../auth/middleware.js";

export function createSettingsRouter(db: DrizzleClient): Router {
  const router = Router();

  // GET /api/settings
  router.get("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || "default";
      const rows = await db
        .select({ key: settings.key, value: settings.value })
        .from(settings)
        .where(eq(settings.userId, userId));

      const result: Record<string, string> = {};
      for (const row of rows) {
        result[row.key] = row.value;
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/settings
  router.patch("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const updates = req.body;
      if (!updates || typeof updates !== "object") {
        res.status(400).json({ error: "Invalid settings object" });
        return;
      }

      const now = new Date().toISOString();
      const userId = req.user?.id || "default";

      for (const [key, val] of Object.entries(updates)) {
        if (typeof key === "string" && key.trim().length > 0) {
          const stringVal = typeof val === "string" ? val : JSON.stringify(val);
          await db
            .insert(settings)
            .values({ key, userId, value: stringVal, updatedAt: now })
            .onConflictDoUpdate({
              target: [settings.key, settings.userId],
              set: { value: stringVal, updatedAt: now },
            });
        }
      }

      const rows = await db
        .select({ key: settings.key, value: settings.value })
        .from(settings)
        .where(eq(settings.userId, userId));

      const result: Record<string, string> = {};
      for (const row of rows) {
        result[row.key] = row.value;
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
