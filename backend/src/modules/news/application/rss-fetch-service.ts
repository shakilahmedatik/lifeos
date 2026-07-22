import Parser from "rss-parser";

import type { NewsArticleRepository, RssFeedRepository } from "../ports/repositories.js";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "LifeOS News Aggregator/1.0",
  },
});

export function createRssFetchService(
  feedRepository: RssFeedRepository,
  articleRepository: NewsArticleRepository,
) {
  const activeFetches = new Set<string>();

  return {
    async fetchFeed(
      feedId: string,
    ): Promise<{ success: boolean; newArticles: number; error?: string }> {
      if (activeFetches.has(feedId)) {
        return { success: false, newArticles: 0, error: "Fetch already in progress" };
      }

      const feed = feedRepository.getById(feedId);
      if (!feed) {
        return { success: false, newArticles: 0, error: "Feed not found" };
      }

      activeFetches.add(feedId);

      try {
        const parsed = await parser.parseURL(feed.url);
        let newArticleCount = 0;

        for (const item of parsed.items) {
          if (!item.link || !item.title) continue;

          const existingArticle = articleRepository.getByUrlAndFeedId(item.link, feedId);
          if (existingArticle) continue;

          articleRepository.create({
            feedId,
            title: item.title,
            url: item.link,
            summary: item.contentSnippet || item.content || undefined,
            publishedAt: item.pubDate || item.isoDate || undefined,
            fetchedAt: new Date().toISOString(),
            isRead: false,
          });

          newArticleCount++;
        }

        feedRepository.updateFetchStatus(feedId, new Date().toISOString());

        return { success: true, newArticles: newArticleCount };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        feedRepository.updateFetchStatus(feedId, new Date().toISOString(), errorMessage);

        return { success: false, newArticles: 0, error: errorMessage };
      } finally {
        activeFetches.delete(feedId);
      }
    },

    async fetchAllActiveFeeds(): Promise<{ totalFeeds: number; totalNewArticles: number }> {
      const activeFeeds = feedRepository.getActive();
      let totalNewArticles = 0;

      for (const feed of activeFeeds) {
        const result = await this.fetchFeed(feed.id);
        if (result.success) {
          totalNewArticles += result.newArticles;
        }
      }

      return { totalFeeds: activeFeeds.length, totalNewArticles };
    },

    isFeedBeingFetched(feedId: string): boolean {
      return activeFetches.has(feedId);
    },
  };
}
