import type { NextFunction, Request, Response } from "express";
import { logger } from "./logger.js";

const httpLog = logger.child({ module: "http" });

// ── ANSI Colors (matches logger.ts) ─────────────────────────────────────
const isTTY = process.stdout.isTTY ?? false;
const c = {
  reset: isTTY ? "\x1b[0m" : "",
  bold: isTTY ? "\x1b[1m" : "",
  dim: isTTY ? "\x1b[2m" : "",
  red: isTTY ? "\x1b[31m" : "",
  green: isTTY ? "\x1b[32m" : "",
  yellow: isTTY ? "\x1b[33m" : "",
  cyan: isTTY ? "\x1b[36m" : "",
  gray: isTTY ? "\x1b[90m" : "",
  magenta: isTTY ? "\x1b[35m" : "",
};

// ── Status Code Coloring ─────────────────────────────────────────────────
function colorStatus(status: number): string {
  if (status >= 500) return `${c.red}${c.bold}${status}${c.reset}`;
  if (status >= 400) return `${c.yellow}${status}${c.reset}`;
  if (status >= 300) return `${c.cyan}${status}${c.reset}`;
  return `${c.green}${status}${c.reset}`;
}

// ── Method Coloring ──────────────────────────────────────────────────────
function colorMethod(method: string): string {
  switch (method) {
    case "GET":
      return `${c.green}${method}${c.reset}`;
    case "POST":
      return `${c.cyan}${method}${c.reset}`;
    case "PATCH":
    case "PUT":
      return `${c.yellow}${method}${c.reset}`;
    case "DELETE":
      return `${c.red}${method}${c.reset}`;
    default:
      return `${c.dim}${method}${c.reset}`;
  }
}

// ── Duration Formatting ──────────────────────────────────────────────────
function formatDuration(ms: number): string {
  if (ms >= 1000) return `${c.red}${c.bold}${(ms / 1000).toFixed(1)}s${c.reset}`;
  if (ms >= 200) return `${c.yellow}${ms}ms${c.reset}`;
  return `${c.dim}${ms}ms${c.reset}`;
}

// ── Skipped Paths ────────────────────────────────────────────────────────
const SKIP_PATHS = new Set([
  "/api/health",
  "/api/notifications/due",
  "/api/notifications/unread-count",
]);

// ── Truncate Body for Logging ────────────────────────────────────────────
function truncateBody(body: unknown, maxLen = 1024): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  try {
    const str = JSON.stringify(body);
    if (str.length <= maxLen) return str;
    return `${str.slice(0, maxLen)}… (${str.length} bytes)`;
  } catch {
    return undefined;
  }
}

// ── Middleware ────────────────────────────────────────────────────────────
export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip noisy polling endpoints
    if (SKIP_PATHS.has(req.path)) return next();

    const start = performance.now();
    const method = req.method;
    const path = req.originalUrl || req.url;

    // Capture response finish
    res.on("finish", () => {
      const duration = Math.round(performance.now() - start);
      const status = res.statusCode;
      const userId = (req as unknown as Record<string, unknown>).user
        ? ((req as unknown as Record<string, unknown>).user as { id: string }).id
        : undefined;

      // Build the inline log string for the arrow-style format
      const arrow = status >= 400 ? `${c.red}←${c.reset}` : `${c.dim}←${c.reset}`;
      const line = `${arrow} ${colorMethod(method)} ${c.bold}${path}${c.reset}  ${colorStatus(status)} ${formatDuration(duration)}`;

      // Build structured meta
      const meta: Record<string, unknown> = {};
      if (userId) meta.userId = userId;

      // Log query params for GET requests if present
      if (method === "GET" && Object.keys(req.query).length > 0) {
        meta.query = req.query;
      }

      // Log request body for mutation methods
      if (["POST", "PATCH", "PUT"].includes(method) && req.body) {
        const bodyStr = truncateBody(req.body);
        if (bodyStr) meta.body = bodyStr;
      }

      if (status >= 500) {
        httpLog.error(line, Object.keys(meta).length > 0 ? meta : undefined);
      } else if (status >= 400) {
        httpLog.warn(line, Object.keys(meta).length > 0 ? meta : undefined);
      } else {
        httpLog.info(line, Object.keys(meta).length > 0 ? meta : undefined);
      }
    });

    next();
  };
}
