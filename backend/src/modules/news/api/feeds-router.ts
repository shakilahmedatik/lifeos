import { Router } from "express";

import { createFeedService } from "../application/feed-service.js";
import type { createRssFetchService } from "../application/rss-fetch-service.js";
import type { RssFeedRepository } from "../ports/repositories.js";

function isValidHttpUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function createFeedsRouter(
  feedRepository: RssFeedRepository,
  rssFetchService?: ReturnType<typeof createRssFetchService>,
): Router {
  const router = Router();
  const feedService = createFeedService(feedRepository);

  router.get("/", async (_req, res) => {
    const feeds = await feedService.getAllFeeds();
    res.json(feeds);
  });

  router.post("/refresh-all", async (_req, res) => {
    if (!rssFetchService) {
      res.status(500).json({ error: "RSS fetch service not available" });
      return;
    }

    const result = await rssFetchService.fetchAllActiveFeeds();
    res.json({
      success: true,
      totalFeeds: result.totalFeeds,
      newArticles: result.totalNewArticles,
    });
  });

  router.get("/:id", async (req, res) => {
    const feed = await feedService.getFeedById(req.params.id);
    if (!feed) {
      res.status(404).json({ error: "Feed not found" });
      return;
    }
    res.json(feed);
  });

  router.post("/", async (req, res) => {
    const { title, url } = req.body;
    const cleanUrl = url?.trim();

    if (!cleanUrl) {
      res.status(400).json({ error: "URL is required" });
      return;
    }

    if (!isValidHttpUrl(cleanUrl)) {
      res.status(400).json({ error: "Invalid HTTP/HTTPS URL" });
      return;
    }

    const cleanTitle = title?.trim() || cleanUrl;
    const result = await feedService.createFeed({ title: cleanTitle, url: cleanUrl });
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    if (result.feed && rssFetchService) {
      rssFetchService.fetchFeed(result.feed.id).catch(() => {});
    }

    res.status(201).json(result.feed);
  });

  router.patch("/:id", async (req, res) => {
    const { title, url } = req.body;
    const patch: { title?: string; url?: string } = {};

    if (title !== undefined) patch.title = title.trim();
    if (url !== undefined) {
      const cleanUrl = url.trim();
      if (!isValidHttpUrl(cleanUrl)) {
        res.status(400).json({ error: "Invalid HTTP/HTTPS URL" });
        return;
      }
      patch.url = cleanUrl;
    }

    const result = await feedService.updateFeed(req.params.id, patch);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(result.feed);
  });

  router.delete("/:id", async (req, res) => {
    const result = await feedService.deleteFeed(req.params.id);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(204).send();
  });

  router.patch("/:id/toggle", async (req, res) => {
    const result = await feedService.toggleFeedStatus(req.params.id);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(result.feed);
  });

  router.post("/:id/refresh", async (req, res) => {
    if (!rssFetchService) {
      res.status(500).json({ error: "RSS fetch service not available" });
      return;
    }

    const result = await rssFetchService.fetchFeed(req.params.id);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ newArticles: result.newArticles });
  });

  return router;
}
