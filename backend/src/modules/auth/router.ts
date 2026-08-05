import { toNodeHandler } from "better-auth/node";
import { Router } from "express";
import type { AuthInstance } from "./auth.js";

export function createAuthRouter(auth: AuthInstance): Router {
  const router = Router();

  // Route all better-auth API requests (/api/auth/*)
  router.all("{*path}", (req, res) => {
    toNodeHandler(auth)(req, res);
  });

  return router;
}
