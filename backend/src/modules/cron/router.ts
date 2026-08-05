import { Receiver } from "@upstash/qstash";
import { Router } from "express";
import type { AppConfig } from "../../config.js";
import type { createRssFetchService } from "../news/application/rss-fetch-service.js";

type RssFetchService = ReturnType<typeof createRssFetchService>;

export function createCronRouter(rssFetchService: RssFetchService, _config: AppConfig): Router {
  const router = Router();

  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  const receiver =
    currentSigningKey && nextSigningKey
      ? new Receiver({
          currentSigningKey,
          nextSigningKey,
        })
      : null;

  // POST /api/cron/sync-news - Triggered hourly by Upstash QStash
  router.post("/sync-news", async (req, res) => {
    // If receiver signature check is configured, verify Upstash request
    if (receiver) {
      const signature = req.headers["upstash-signature"] as string;
      if (!signature) {
        res.status(401).json({ error: "Missing Upstash signature header" });
        return;
      }

      const bodyText = JSON.stringify(req.body);
      const isValid = await receiver
        .verify({
          signature,
          body: bodyText,
        })
        .catch(() => false);

      if (!isValid) {
        res.status(401).json({ error: "Invalid Upstash signature" });
        return;
      }
    }

    try {
      const result = await rssFetchService.fetchAllActiveFeeds();
      res.json({
        success: true,
        totalFeedsProcessed: result.totalFeeds,
        newArticlesProcessed: result.totalNewArticles,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
