import type { NextFunction, Request, Response } from "express";
import type { AuthInstance } from "./auth.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    pin?: string | null;
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

      const session = await auth.api.getSession({
        headers,
      });

      if (!session) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      req.user = session.user;
      req.session = session.session;
      next();
    } catch (_error) {
      res.status(401).json({ error: "Unauthorized" });
    }
  };
}
