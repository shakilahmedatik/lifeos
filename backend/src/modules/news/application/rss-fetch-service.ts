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

      const feed = await feedRepository.getById(feedId);
      if (!feed) {
        return { success: false, newArticles: 0, error: "Feed not found" };
      }

      activeFetches.add(feedId);

      try {
        const parsed = await parser.parseURL(feed.url);
        let newArticleCount = 0;

        for (const item of parsed.items) {
          const rawLink = item.link?.trim();
          const rawTitle = item.title?.trim();
          if (!rawLink || !rawTitle) continue;

          const existingArticle = await articleRepository.getByUrlAndFeedId(rawLink, feedId);
          if (existingArticle) continue;

          const rawSummary = item.contentSnippet || item.content || undefined;
          const cleanSummary = sanitizeSummary(rawSummary);
          const publishedAt = parseValidDate(item.pubDate || item.isoDate);

          await articleRepository.create(
            {
              userId: feed.userId,
              feedId,
              title: rawTitle,
              url: rawLink,
              summary: cleanSummary,
              publishedAt,
              fetchedAt: new Date().toISOString(),
              isRead: false,
            },
            feed.userId,
          );

          newArticleCount++;
        }

        await feedRepository.updateFetchStatus(feedId, new Date().toISOString());

        return { success: true, newArticles: newArticleCount };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await feedRepository.updateFetchStatus(feedId, new Date().toISOString(), errorMessage);

        return { success: false, newArticles: 0, error: errorMessage };
      } finally {
        activeFetches.delete(feedId);
      }
    },

    async fetchAllActiveFeeds(
      userId?: string,
    ): Promise<{ totalFeeds: number; totalNewArticles: number }> {
      const activeFeeds =
        userId !== undefined
          ? await feedRepository.getActive(userId)
          : await feedRepository.getAllActiveAcrossUsers();
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

function sanitizeSummary(str?: string): string | undefined {
  if (!str) return undefined;
  const clean = str
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > 0 ? clean : undefined;
}

function parseValidDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  const timestamp = Date.parse(dateStr);
  if (Number.isNaN(timestamp)) return undefined;
  return new Date(timestamp).toISOString();
}
