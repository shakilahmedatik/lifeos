import type { NextFunction, Request, Response } from "express";
import { Redis } from "ioredis";
import { logger } from "./logger.js";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  skip?: (req: Request) => boolean;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

let redisClient: Redis | null = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    redisClient.connect().catch((err: Error) => {
      logger.error("Failed to connect to Redis for rate limiting, falling back to in-memory", {
        error: err.message,
      });
      redisClient = null;
    });
    logger.info("Initialized Redis client for rate limiting");
  } catch (err) {
    logger.error("Error creating Redis client", { error: (err as Error).message });
    redisClient = null;
  }
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = "Too many requests, please try again later.", skip } = options;
  const clients = new Map<string, ClientRecord>();
  const MAX_CLIENTS = 10_000;
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction) => {
    if (skip?.(req)) {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();

    if (redisClient && redisClient.status === "ready") {
      try {
        const key = `ratelimit:${ip}`;
        const count = await redisClient.incr(key);

        if (count === 1) {
          await redisClient.expire(key, windowSeconds);
        }

        const ttl = await redisClient.ttl(key);
        const resetTime = now + (ttl > 0 ? ttl * 1000 : windowMs);
        const remaining = Math.max(0, max - count);

        res.setHeader("RateLimit-Limit", max.toString());
        res.setHeader("RateLimit-Remaining", remaining.toString());
        res.setHeader("RateLimit-Reset", Math.ceil(resetTime / 1000).toString());

        if (count > max) {
          res.status(429).json({ error: message });
          return;
        }

        return next();
      } catch (err) {
        logger.error("Redis rate limiter error, falling back to in-memory", {
          error: (err as Error).message,
        });
      }
    }

    // In-Memory Fallback (Lazy Cleanup, no setInterval)
    let record = clients.get(ip);
    if (!record || now > record.resetTime) {
      if (clients.size >= MAX_CLIENTS) {
        for (const [key, val] of clients.entries()) {
          if (now > val.resetTime) {
            clients.delete(key);
          }
        }
        if (clients.size >= MAX_CLIENTS) {
          const oldestKey = clients.keys().next().value;
          if (oldestKey) clients.delete(oldestKey);
        }
      }
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
  max: 2500, // Limit each IP to 2500 requests per 15 min
  skip: (req) => req.path.startsWith("/health"),
});
