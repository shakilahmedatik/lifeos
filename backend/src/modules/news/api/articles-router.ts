import { Router } from "express";

import { createArticleService } from "../application/article-service.js";
import type { NewsArticleRepository, RssFeedRepository } from "../ports/repositories.js";

export function createArticlesRouter(
  articleRepository: NewsArticleRepository,
  feedRepository: RssFeedRepository,
): Router {
  const router = Router();
  const articleService = createArticleService(articleRepository, feedRepository);

  router.get("/", async (req, res) => {
    const { feedId, search, limit, offset } = req.query;
    const limitNum = limit ? Number.parseInt(limit as string, 10) : 20;
    const offsetNum = offset ? Number.parseInt(offset as string, 10) : 0;

    let articles: Awaited<ReturnType<typeof articleService.getArticles>>;
    if (search) {
      articles = await articleService.searchArticles(search as string, limitNum, offsetNum);
    } else if (feedId) {
      articles = await articleService.getArticlesByFeedId(feedId as string, limitNum, offsetNum);
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
