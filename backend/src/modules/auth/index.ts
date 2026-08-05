import type Database from "better-sqlite3";
import type { Router } from "express";
import type { AppConfig } from "../../config.js";
import { type AuthInstance, createAuth } from "./auth.js";
import { createAuthMiddleware } from "./middleware.js";
import { createAuthRouter } from "./router.js";

export interface AuthModule {
  auth: AuthInstance;
  router: Router;
  middleware: ReturnType<typeof createAuthMiddleware>;
}

export function initAuthModule(db: Database.Database, config: AppConfig): AuthModule {
  const auth = createAuth(db, config);
  const router = createAuthRouter(auth);
  const middleware = createAuthMiddleware(auth);

  return {
    auth,
    router,
    middleware,
  };
}
