import { Router } from "express";

import type { createRssFetchService } from "../application/rss-fetch-service.js";
import type { NewsArticleRepository, RssFeedRepository } from "../ports/repositories.js";
import { createArticlesRouter } from "./articles-router.js";
import { createFeedsRouter } from "./feeds-router.js";

export function createNewsRouter(
  feedRepository: RssFeedRepository,
  articleRepository: NewsArticleRepository,
  rssFetchService?: ReturnType<typeof createRssFetchService>,
): Router {
  const router = Router();

  router.use("/feeds", createFeedsRouter(feedRepository, rssFetchService));
  router.use("/articles", createArticlesRouter(articleRepository, feedRepository));

  return router;
}
