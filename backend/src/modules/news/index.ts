import type Database from "better-sqlite3";
import { createSqliteNewsArticleRepository } from "./adapters/sqlite/sqlite-news-article-repository.js";
import { createSqliteRssFeedRepository } from "./adapters/sqlite/sqlite-rss-feed-repository.js";
import { createNewsRouter } from "./api/router.js";
import { createNewsScheduler } from "./application/news-scheduler.js";
import { createRssFetchService } from "./application/rss-fetch-service.js";

export function initNewsModule(db: Database.Database) {
  const rssFeedRepo = createSqliteRssFeedRepository(db);
  const newsArticleRepo = createSqliteNewsArticleRepository(db);
  const rssFetchService = createRssFetchService(rssFeedRepo, newsArticleRepo);
  const newsScheduler = createNewsScheduler(rssFetchService);

  const router = createNewsRouter(rssFeedRepo, newsArticleRepo, rssFetchService);

  return {
    rssFeedRepo,
    newsArticleRepo,
    rssFetchService,
    newsScheduler,
    router,
  };
}
