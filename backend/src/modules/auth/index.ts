import type { Client } from "@libsql/client";
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

export function initAuthModule(client: Client, config: AppConfig): AuthModule {
  const auth = createAuth(client, config);
  const router = createAuthRouter(auth, client);
  const middleware = createAuthMiddleware(auth);

  return {
    auth,
    router,
    middleware,
  };
}
