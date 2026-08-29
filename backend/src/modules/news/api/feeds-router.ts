import { Router } from "express";

import type { AuthenticatedRequest } from "../../auth/middleware.js";
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

  router.get("/", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const feeds = await feedService.getAllFeeds(userId);
    res.json(feeds);
  });

  router.post("/refresh-all", async (req: AuthenticatedRequest, res) => {
    if (!rssFetchService) {
      res.status(500).json({ error: "RSS fetch service not available" });
      return;
    }

    const userId = req.user?.id || (req.query.userId as string) || "default";
    const result = await rssFetchService.fetchAllActiveFeeds(userId);
    res.json({
      success: true,
      totalFeeds: result.totalFeeds,
      newArticles: result.totalNewArticles,
    });
  });

  router.get("/:id", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const feed = await feedService.getFeedById(req.params.id as string, userId);
    if (!feed) {
      res.status(404).json({ error: "Feed not found" });
      return;
    }
    res.json(feed);
  });

  router.post("/", async (req: AuthenticatedRequest, res) => {
    const userId =
      req.user?.id || (req.body.userId as string) || (req.query.userId as string) || "default";
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
    const result = await feedService.createFeed({ title: cleanTitle, url: cleanUrl }, userId);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    if (result.feed && rssFetchService) {
      rssFetchService.fetchFeed(result.feed.id).catch(() => {});
    }

    res.status(201).json(result.feed);
  });

  router.patch("/:id", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
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

    const result = await feedService.updateFeed(req.params.id as string, patch, userId);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(result.feed);
  });

  router.delete("/:id", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const result = await feedService.deleteFeed(req.params.id as string, userId);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(204).send();
  });

  router.patch("/:id/toggle", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const result = await feedService.toggleFeedStatus(req.params.id as string, userId);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(result.feed);
  });

  router.post("/:id/refresh", async (req: AuthenticatedRequest, res) => {
    if (!rssFetchService) {
      res.status(500).json({ error: "RSS fetch service not available" });
      return;
    }

    const userId = req.user?.id || (req.query.userId as string) || "default";
    const feed = await feedService.getFeedById(req.params.id as string, userId);
    if (!feed) {
      res.status(404).json({ error: "Feed not found" });
      return;
    }

    const result = await rssFetchService.fetchFeed(req.params.id as string);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ newArticles: result.newArticles });
  });

  return router;
}
