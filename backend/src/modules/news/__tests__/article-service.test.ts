import { beforeEach, describe, expect, it } from "vitest";

import { createArticleService } from "../application/article-service.js";
import type { NewsArticle, RssFeed } from "../domain/types.js";
import type { NewsArticleRepository, RssFeedRepository } from "../ports/repositories.js";

function createMockArticleRepository(): NewsArticleRepository {
  const articles = new Map<string, NewsArticle>();

  return {
    async getById(id: string): Promise<NewsArticle | undefined> {
      return articles.get(id);
    },
    async getAll(limit = 20, offset = 0): Promise<NewsArticle[]> {
      return Array.from(articles.values()).slice(offset, offset + limit);
    },
    async getByFeedId(feedId: string, limit = 20, offset = 0): Promise<NewsArticle[]> {
      return Array.from(articles.values())
        .filter((a) => a.feedId === feedId)
        .slice(offset, offset + limit);
    },
    async getRecent(limit: number): Promise<NewsArticle[]> {
      return Array.from(articles.values()).slice(0, limit);
    },
    async search(query: string, feedId?: string, limit = 20, offset = 0): Promise<NewsArticle[]> {
      const q = query.toLowerCase();
      return Array.from(articles.values())
        .filter((a) => {
          const matchesQuery = a.title.toLowerCase().includes(q) || (a.summary && a.summary.toLowerCase().includes(q));
          const matchesFeed = feedId ? a.feedId === feedId : true;
          return matchesQuery && matchesFeed;
        })
        .slice(offset, offset + limit);
    },
    async getByUrlAndFeedId(url: string, feedId: string): Promise<NewsArticle | undefined> {
      return Array.from(articles.values()).find((a) => a.url === url && a.feedId === feedId);
    },
    async create(article: Omit<NewsArticle, "id"> & { id?: string }): Promise<NewsArticle> {
      const created: NewsArticle = {
        id: article.id || `art-${articles.size + 1}`,
        feedId: article.feedId,
        title: article.title,
        url: article.url,
        summary: article.summary,
        publishedAt: article.publishedAt,
        fetchedAt: article.fetchedAt,
        isRead: article.isRead,
      };
      articles.set(created.id, created);
      return created;
    },
    async markAsRead(id: string): Promise<NewsArticle | undefined> {
      const article = articles.get(id);
      if (!article) return undefined;
      const updated = { ...article, isRead: true };
      articles.set(id, updated);
      return updated;
    },
    async deleteOlderThan(_date: string): Promise<number> {
      return 0;
    },
  };
}

describe("ArticleService", () => {
  let articleService: ReturnType<typeof createArticleService>;
  let mockArticleRepo: NewsArticleRepository;

  beforeEach(() => {
    mockArticleRepo = createMockArticleRepository();
    articleService = createArticleService(mockArticleRepo, {} as RssFeedRepository);
  });

  it("should create and fetch articles", async () => {
    const created = await articleService.createArticle({
      feedId: "feed-1",
      title: "Tech News Today",
      url: "https://example.com/news1",
      summary: "Sample summary",
      fetchedAt: new Date().toISOString(),
      isRead: false,
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe("Tech News Today");

    const articles = await articleService.getArticles();
    expect(articles).toHaveLength(1);
  });

  it("should filter search by feedId", async () => {
    await articleService.createArticle({
      feedId: "feed-1",
      title: "AI Breakthrough",
      url: "https://example.com/news1",
      fetchedAt: new Date().toISOString(),
      isRead: false,
    });

    await articleService.createArticle({
      feedId: "feed-2",
      title: "AI Developments",
      url: "https://example.com/news2",
      fetchedAt: new Date().toISOString(),
      isRead: false,
    });

    const searchAll = await articleService.searchArticles("AI");
    expect(searchAll).toHaveLength(2);

    const searchFeed1 = await articleService.searchArticles("AI", "feed-1");
    expect(searchFeed1).toHaveLength(1);
    expect(searchFeed1[0].feedId).toBe("feed-1");
  });

  it("should mark article as read", async () => {
    const article = await articleService.createArticle({
      feedId: "feed-1",
      title: "Reading Test",
      url: "https://example.com/test",
      fetchedAt: new Date().toISOString(),
      isRead: false,
    });

    const res = await articleService.markAsRead(article.id);
    expect(res.success).toBe(true);
    expect(res.article?.isRead).toBe(true);
  });
});
