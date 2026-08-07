import { Router } from "express";

import { createArticleService } from "../application/article-service.js";
import type { NewsArticleRepository, RssFeedRepository } from "../ports/repositories.js";

import type { createNewsScheduler } from "../application/news-scheduler.js";

export function createArticlesRouter(
  articleRepository: NewsArticleRepository,
  feedRepository: RssFeedRepository,
  newsScheduler?: ReturnType<typeof createNewsScheduler>,
): Router {
  const router = Router();
  const articleService = createArticleService(articleRepository, feedRepository);

  router.get("/", async (req, res) => {
    if (newsScheduler) {
      await newsScheduler.runFetchCycleIfNeeded();
    }
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
        targetFeedId,
        limitNum,
        offsetNum,
      );
    } else if (targetFeedId) {
      articles = await articleService.getArticlesByFeedId(targetFeedId, limitNum, offsetNum);
    } else {
      articles = await articleService.getArticles(limitNum, offsetNum);
    }

    res.json(articles);
  });

  router.get("/ticker", async (_req, res) => {
    const articles = await articleService.getRecentArticles(5);
    res.json(articles);
  });

  router.get("/:id", async (req, res) => {
    const article = await articleService.getArticleById(req.params.id);
    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }
    res.json(article);
  });

  router.patch("/:id/read", async (req, res) => {
    const result = await articleService.markAsRead(req.params.id);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(result.article);
  });

  return router;
}
