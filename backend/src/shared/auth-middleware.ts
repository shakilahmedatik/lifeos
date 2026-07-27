import type { NextFunction, Request, Response } from "express";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
  if (!AUTH_PASSWORD) return next();

  const token = req.headers["x-auth-token"] || req.query.token;
  if (token === AUTH_PASSWORD) return next();

  res.status(401).json({ error: "Unauthorized" });
}
