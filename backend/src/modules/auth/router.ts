import { toNodeHandler } from "better-auth/node";
import { eq } from "drizzle-orm";
import { Router } from "express";
import type { DrizzleClient } from "../../shared/db.js";
import { user } from "../../shared/schema.js";
import type { AuthInstance } from "./auth.js";

export function createAuthRouter(auth: AuthInstance, db: DrizzleClient): Router {
  const router = Router();

  // Custom route for updating user profile details
  router.patch("/profile", async (req, res, next) => {
    try {
      const cleanHeaders = new Headers();
      const authHeader = req.headers.authorization;
      if (authHeader) {
        cleanHeaders.set("authorization", authHeader);
      }
      const cookieHeader = req.headers.cookie;
      if (cookieHeader) {
        cleanHeaders.set("cookie", cookieHeader);
      }

      const session = await auth.api.getSession({ headers: cleanHeaders });
      if (!session?.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { name, email } = req.body || {};
      const userId = session.user.id;

      if (!name && !email) {
        res.status(400).json({ error: "Name or email required for update" });
        return;
      }

      const updates: Record<string, string> = {};
      if (name && typeof name === "string") updates.name = name.trim();
      if (email && typeof email === "string") {
        const trimmedEmail = email.trim();
        const [existing] = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.email, trimmedEmail));
        if (existing && existing.id !== userId) {
          res.status(409).json({ error: "Email already in use" });
          return;
        }
        updates.email = trimmedEmail;
      }
      updates.updatedAt = new Date().toISOString();

      await db.update(user).set(updates).where(eq(user.id, userId));

      const [updatedRow] = await db
        .select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt })
        .from(user)
        .where(eq(user.id, userId));

      if (!updatedRow) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({ user: updatedRow });
    } catch (err) {
      next(err);
    }
  });

  // Route all better-auth API requests (/api/auth/*)
  router.all("{*path}", (req, res) => {
    toNodeHandler(auth)(req, res);
  });

  return router;
}
