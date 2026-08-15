import type { Client } from "@libsql/client";
import { createSqliteNewsArticleRepository } from "./adapters/sqlite/sqlite-news-article-repository.js";
import { createSqliteRssFeedRepository } from "./adapters/sqlite/sqlite-rss-feed-repository.js";
import { createNewsRouter } from "./api/router.js";
import { createNewsScheduler } from "./application/news-scheduler.js";
import { createRssFetchService } from "./application/rss-fetch-service.js";

export function initNewsModule(client: Client) {
  const rssFeedRepo = createSqliteRssFeedRepository(client);
  const newsArticleRepo = createSqliteNewsArticleRepository(client);
  const rssFetchService = createRssFetchService(rssFeedRepo, newsArticleRepo);
  const newsScheduler = createNewsScheduler(rssFetchService);

  // Auto-seed default RSS feeds if empty
  (async () => {
    try {
      const feeds = await rssFeedRepo.getAll();
      if (feeds.length === 0) {
        const defaultFeeds = [
          { title: "Hacker News", url: "https://news.ycombinator.com/rss" },
          { title: "TechCrunch", url: "https://techcrunch.com/feed/" },
          { title: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
        ];
        for (const f of defaultFeeds) {
          const id = `feed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          await rssFeedRepo.create(id, f);
        }
        await rssFetchService.fetchAllActiveFeeds();
      }
    } catch {
      // ignore
    }
  })();

  const router = createNewsRouter(rssFeedRepo, newsArticleRepo, newsScheduler, rssFetchService);

  return {
    rssFeedRepo,
    newsArticleRepo,
    rssFetchService,
    newsScheduler,
    router,
  };
}
