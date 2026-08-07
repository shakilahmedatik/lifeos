import { Router } from "express";
import type { createNewsScheduler } from "../application/news-scheduler.js";
import type { createRssFetchService } from "../application/rss-fetch-service.js";
import type { NewsArticleRepository, RssFeedRepository } from "../ports/repositories.js";
import { createArticlesRouter } from "./articles-router.js";
import { createFeedsRouter } from "./feeds-router.js";

export function createNewsRouter(
  feedRepository: RssFeedRepository,
  articleRepository: NewsArticleRepository,
  newsScheduler?: ReturnType<typeof createNewsScheduler>,
  rssFetchService?: ReturnType<typeof createRssFetchService>,
): Router {
  const router = Router();

  router.use("/feeds", createFeedsRouter(feedRepository, rssFetchService));
  router.use("/articles", createArticlesRouter(articleRepository, feedRepository, newsScheduler));

  return router;
}
