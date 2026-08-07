import type { Client } from "@libsql/client";
import { toNodeHandler } from "better-auth/node";
import { Router } from "express";
import type { AuthInstance } from "./auth.js";

export function createAuthRouter(auth: AuthInstance, client: Client): Router {
  const router = Router();

  // Custom route for updating user profile details
  router.patch("/profile", async (req, res, next) => {
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

      const session = await auth.api.getSession({ headers });
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

      const updates: string[] = [];
      const args: (string | null)[] = [];

      if (name && typeof name === "string") {
        updates.push("name = ?");
        args.push(name.trim());
      }
      if (email && typeof email === "string") {
        updates.push("email = ?");
        args.push(email.trim());
      }

      if (updates.length > 0) {
        updates.push("updatedAt = datetime('now')");
        args.push(userId);

        await client.execute({
          sql: `UPDATE user SET ${updates.join(", ")} WHERE id = ?`,
          args,
        });
      }

      const updatedUserRes = await client.execute({
        sql: "SELECT id, name, email, createdAt FROM user WHERE id = ?",
        args: [userId],
      });

      const updatedRow = updatedUserRes.rows[0];
      if (!updatedRow) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const user = {
        id: String(updatedRow.id),
        name: String(updatedRow.name),
        email: String(updatedRow.email),
        createdAt: String(updatedRow.createdAt || ""),
      };

      res.json({ user });
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
