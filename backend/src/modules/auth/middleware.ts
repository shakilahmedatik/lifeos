import type { NextFunction, Request, Response } from "express";
import { logger } from "../../shared/logger.js";
import type { AuthInstance } from "./auth.js";

const authLog = logger.child({ module: "auth" });

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
  session?: {
    id: string;
    userId: string;
    token: string;
  };
}

export function createAuthMiddleware(auth: AuthInstance) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            for (const v of value) {
              headers.append(key, v);
            }
          } else {
            headers.set(key, value);
          }
        }
      }

      // Do not delete origin, better-auth needs it for POST CSRF checks
      // headers.delete("origin");

      authLog.debug("Validating session", {
        method: req.method,
        path: req.originalUrl,
        hasAuthorization: headers.has("authorization") ? "true" : "false",
        authTokenLength: headers.get("authorization")?.length || 0,
        authTokenPreview: headers.get("authorization")?.substring(0, 15) || "none",
        origin: headers.get("origin") || "none",
      });

      // Create a clean headers object with authorization token and cookies
      // This bypasses any CSRF or strict parsing issues caused by Origin, Content-Type, etc.
      const cleanHeaders = new Headers();
      const authorization = headers.get("authorization");
      if (authorization) {
        cleanHeaders.set("authorization", authorization);
      }
      const cookie = headers.get("cookie");
      if (cookie) {
        cleanHeaders.set("cookie", cookie);
      }

      const session = await auth.api.getSession({
        headers: cleanHeaders,
      });

      if (!session) {
        authLog.warn("Unauthorized request — no session", {
          method: req.method,
          path: req.originalUrl,
        });
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      authLog.debug("Session validated", {
        userId: session.user.id,
        sessionId: session.session.id,
      });

      req.user = session.user;
      req.session = session.session;
      next();
    } catch (error) {
      authLog.error("Auth middleware error", {
        error: (error as Error).message,
        stack: (error as Error).stack,
        method: req.method,
        path: req.originalUrl,
      });
      res.status(401).json({ error: "Unauthorized" });
    }
  };
}
