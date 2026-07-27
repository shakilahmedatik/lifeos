import { Router } from "express";
import { authMiddleware } from "../../../shared/auth-middleware.js";

export function createAuthRouter(): Router {
  const router = Router();

  router.post("/login", (req, res) => {
    const password = process.env.AUTH_PASSWORD;
    const { password: inputPassword } = req.body || {};
    if (!password) {
      return res.json({ ok: true });
    }
    if (inputPassword === password) {
      return res.json({ ok: true });
    }
    res.status(401).json({ ok: false, error: "Invalid password" });
  });

  router.get("/verify", authMiddleware, (_req, res) => {
    res.json({ ok: true });
  });

  return router;
}
