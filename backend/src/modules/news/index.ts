import type { Client } from "@libsql/client";
import { createSqliteNewsArticleRepository } from "./adapters/sqlite/sqlite-news-article-repository.js";
import { createSqliteRssFeedRepository } from "./adapters/sqlite/sqlite-rss-feed-repository.js";
import { createNewsRouter } from "./api/router.js";
import { createNewsScheduler } from "./application/news-scheduler.js";
import { createRssFetchService } from "./application/rss-fetch-service.js";

export function initNewsModule(client: Client) {
  let rssFetchServiceInstance: ReturnType<typeof createRssFetchService>;

  const rssFeedRepo = createSqliteRssFeedRepository(client, async (createdFeedIds) => {
    if (rssFetchServiceInstance && createdFeedIds.length > 0) {
      await Promise.allSettled(
        createdFeedIds.map((feedId) => rssFetchServiceInstance.fetchFeed(feedId)),
      );
    }
  });
  const newsArticleRepo = createSqliteNewsArticleRepository(client);
  const rssFetchService = createRssFetchService(rssFeedRepo, newsArticleRepo);
  rssFetchServiceInstance = rssFetchService;
  const newsScheduler = createNewsScheduler(rssFetchService);

  const router = createNewsRouter(rssFeedRepo, newsArticleRepo, newsScheduler, rssFetchService);

  return {
    rssFeedRepo,
    newsArticleRepo,
    rssFetchService,
    newsScheduler,
    router,
  };
}
