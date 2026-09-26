import cors from "cors";
import express, { type Express } from "express";
import type { Container } from "./container.js";
import { logger } from "./shared/logger.js";
import { apiRateLimiter, authRateLimiter } from "./shared/rate-limiter.js";
import { requestLogger } from "./shared/request-logger.js";

const appLog = logger.child({ module: "app" });

export function createApp(container: Container): Express {
  const app = express();
  const { config, modules } = container;

  app.set("trust proxy", 1);

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
        } else if (process.env.NODE_ENV !== "production") {
          callback(null, true); // Permissive fallback only for local dev cross-origin access
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
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

  app.use(express.json({ limit: "10mb" }));

  // ── Logging & Rate Limiting ────────────────────────────────────────────
  app.use(requestLogger());
  app.use("/api", apiRateLimiter);
  app.use("/api/auth/sign-in", authRateLimiter);
  app.use("/api/auth/sign-up", authRateLimiter);

  // Auth & Health public routes
  app.use("/api/auth", modules.auth.router);
  app.use("/api/health", modules.health.router);

  // Authenticated domain routes
  app.use("/api/routine", modules.auth.middleware, modules.routine.router);
  app.use("/api/habits", modules.auth.middleware, modules.habits.router);
  app.use("/api/dashboard", modules.auth.middleware, modules.dashboard.router);
  app.use("/api/workouts", modules.auth.middleware, modules.workouts.router);
  app.use("/api/finance", modules.auth.middleware, modules.finance.router);
  app.use("/api/skills", modules.auth.middleware, modules.skills.router);
  app.use("/api/settings", modules.auth.middleware, modules.settings.router);
  app.use("/api/sync", modules.auth.middleware, modules.sync.router);

  // Global error handler
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      appLog.error("Unhandled error", { error: err.message, stack: err.stack });
      res.status(500).json({ error: "Internal server error" });
    },
  );

  return app;
}
