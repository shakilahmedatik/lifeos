import { Router } from "express";

import type { AuthenticatedRequest } from "../../auth/middleware.js";
import { createArticleService } from "../application/article-service.js";
import type { createNewsScheduler } from "../application/news-scheduler.js";
import type { createRssFetchService } from "../application/rss-fetch-service.js";
import type { NewsArticleRepository, RssFeedRepository } from "../ports/repositories.js";

export function createArticlesRouter(
  articleRepository: NewsArticleRepository,
  feedRepository: RssFeedRepository,
  newsScheduler?: ReturnType<typeof createNewsScheduler>,
  rssFetchService?: ReturnType<typeof createRssFetchService>,
): Router {
  const router = Router();
  const articleService = createArticleService(articleRepository, feedRepository);

  router.get("/", async (req: AuthenticatedRequest, res) => {
    if (newsScheduler) {
      await newsScheduler.runFetchCycleIfNeeded();
    }
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const { feedId, search, limit, offset } = req.query;
    const parsedLimit = Number.parseInt(limit as string, 10);
    const parsedOffset = Number.parseInt(offset as string, 10);
    const limitNum = Number.isNaN(parsedLimit) ? 20 : Math.max(1, Math.min(100, parsedLimit));
    const offsetNum = Number.isNaN(parsedOffset) ? 0 : Math.max(0, parsedOffset);

    const targetFeedId = typeof feedId === "string" && feedId.trim() ? feedId.trim() : undefined;
    const targetSearch = typeof search === "string" && search.trim() ? search.trim() : undefined;

    let articles: Awaited<ReturnType<typeof articleService.getArticles>>;
    if (targetSearch) {
      articles = await articleService.searchArticles(
        targetSearch,
        userId,
        targetFeedId,
        limitNum,
        offsetNum,
      );
    } else if (targetFeedId) {
      articles = await articleService.getArticlesByFeedId(targetFeedId, userId, limitNum, offsetNum);
    } else {
      articles = await articleService.getArticles(userId, limitNum, offsetNum);
    }

    if (articles.length === 0 && rssFetchService && !targetSearch) {
      const feeds = await feedRepository.getAll(userId);
      if (feeds.length > 0) {
        await rssFetchService.fetchAllActiveFeeds(userId);
        if (targetFeedId) {
          articles = await articleService.getArticlesByFeedId(targetFeedId, userId, limitNum, offsetNum);
        } else {
          articles = await articleService.getArticles(userId, limitNum, offsetNum);
        }
      }
    }

    res.json(articles);
  });

  router.get("/ticker", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    let articles = await articleService.getRecentArticles(5, userId);
    if (articles.length === 0 && rssFetchService) {
      const feeds = await feedRepository.getAll(userId);
      if (feeds.length > 0) {
        await rssFetchService.fetchAllActiveFeeds(userId);
        articles = await articleService.getRecentArticles(5, userId);
      }
    }
    res.json(articles);
  });

  router.get("/:id", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const article = await articleService.getArticleById(req.params.id as string, userId);
    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }
    res.json(article);
  });

  router.patch("/:id/read", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const result = await articleService.markAsRead(req.params.id as string, userId);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(result.article);
  });

  return router;
}
