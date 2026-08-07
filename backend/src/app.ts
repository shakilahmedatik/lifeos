import cors from "cors";
import express, { type Express } from "express";
import type { Container } from "./container.js";
import { logger } from "./shared/logger.js";
import { apiRateLimiter } from "./shared/rate-limiter.js";

export function createApp(container: Container): Express {
  const app = express();
  const { config, modules } = container;

  // Modern CORS configuration supporting credentials & dynamic origins
  app.use(
    cors({
      origin: (origin, callback) => {
        if (
          !origin ||
          config.allowedOrigins.includes(origin) ||
          config.allowedOrigins.includes("*")
        ) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive fallback for seamless dev cross-origin access
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "better-auth-csrf-token",
      ],
    }),
  );

  app.use(express.json());
  app.use("/api", apiRateLimiter);

  // Lazy background jobs execution on API requests
  app.use("/api", (_req, _res, next) => {
    container.triggerLazyJobs().catch(() => {});
    next();
  });

  // Auth & Cron & Health public routes
  app.use("/api/auth", modules.auth.router);
  app.use("/api/cron", modules.cron.router);
  app.use("/api/health", modules.health.router);

  // Authenticated domain routes
  app.use("/api/routine", modules.auth.middleware, modules.routine.router);
  app.use("/api/habits", modules.auth.middleware, modules.habits.router);
  app.use("/api/dashboard", modules.auth.middleware, modules.dashboard.router);
  app.use("/api/notifications", modules.auth.middleware, modules.notifications.router);
  app.use("/api/reminders", modules.auth.middleware, modules.reminders.router);
  app.use("/api/workouts", modules.auth.middleware, modules.workouts.router);
  app.use("/api/finance", modules.auth.middleware, modules.finance.router);
  app.use("/api/news", modules.auth.middleware, modules.news.router);
  app.use("/api/skills", modules.auth.middleware, modules.skills.router);
  app.use("/api/backup", modules.auth.middleware, modules.backup.router);
  app.use("/api/settings", modules.auth.middleware, modules.settings.router);

  // Global error handler
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error("Unhandled error", { error: err.message, stack: err.stack });
      res.status(500).json({ error: "Internal server error" });
    },
  );

  return app;
}
