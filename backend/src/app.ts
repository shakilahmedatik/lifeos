import express, { type Express } from "express";
import type { Container } from "./container.js";
import { authMiddleware } from "./shared/auth-middleware.js";
import { logger } from "./shared/logger.js";
import { apiRateLimiter } from "./shared/rate-limiter.js";

export function createApp(container: Container): Express {
  const app = express();
  const { config, modules } = container;

  // CORS: restrict to local frontend origin
  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", `http://localhost:${config.frontendPort}`);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-auth-token");
    if (_req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(express.json());
  app.use("/api", apiRateLimiter);

  // Unprotected routes
  app.use("/api/health", modules.health.router);
  app.use("/api/auth", modules.auth.router);

  // Authentication barrier
  app.use("/api", authMiddleware);

  // Protected domain routes
  app.use("/api/routine", modules.routine.router);
  app.use("/api/habits", modules.habits.router);
  app.use("/api/dashboard", modules.dashboard.router);
  app.use("/api/notifications", modules.notifications.router);
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
