import type { NextFunction, Request, Response } from "express";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = "Too many requests, please try again later." } = options;
  const clients = new Map<string, ClientRecord>();

  // Periodically clean up expired entries
  setInterval(
    () => {
      const now = Date.now();
      for (const [ip, record] of clients.entries()) {
        if (now > record.resetTime) {
          clients.delete(ip);
        }
      }
    },
    Math.max(windowMs, 60_000),
  );

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();

    let record = clients.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      clients.set(ip, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    res.setHeader("RateLimit-Limit", max.toString());
    res.setHeader("RateLimit-Remaining", remaining.toString());
    res.setHeader("RateLimit-Reset", Math.ceil(record.resetTime / 1000).toString());

    if (record.count > max) {
      res.status(429).json({ error: message });
      return;
    }

    next();
  };
}

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 min
});
