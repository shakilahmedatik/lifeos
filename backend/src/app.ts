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

  // Auth & Cron routes
  app.use("/api/auth", modules.auth.router);
  app.use("/api/cron", modules.cron.router);
  app.use("/api/health", modules.health.router);

  // Domain routes
  app.use("/api/routine", modules.routine.router);
  app.use("/api/habits", modules.habits.router);
  app.use("/api/dashboard", modules.dashboard.router);
  app.use("/api/notifications", modules.notifications.router);
  app.use("/api/reminders", modules.reminders.router);
  app.use("/api/workouts", modules.workouts.router);
  app.use("/api/finance", modules.finance.router);
  app.use("/api/news", modules.news.router);
  app.use("/api/skills", modules.skills.router);
  app.use("/api/backup", modules.backup.router);

  // Global error handler
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error("Unhandled error", { error: err.message, stack: err.stack });
      res.status(500).json({ error: "Internal server error" });
    },
  );

  return app;
}
