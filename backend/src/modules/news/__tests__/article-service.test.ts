import { beforeEach, describe, expect, it } from "vitest";

import { createArticleService } from "../application/article-service.js";
import type { NewsArticle } from "../domain/types.js";
import type { NewsArticleRepository, RssFeedRepository } from "../ports/repositories.js";

function createMockArticleRepository(): NewsArticleRepository {
  const articles = new Map<string, NewsArticle>();

  return {
    async getById(id: string, userId?: string): Promise<NewsArticle | undefined> {
      const art = articles.get(id);
      if (!art) return undefined;
      if (userId && art.userId && art.userId !== userId && userId !== "default") {
        return undefined;
      }
      return art;
    },
    async getAll(userId?: string, limit = 20, offset = 0): Promise<NewsArticle[]> {
      const all = Array.from(articles.values()).filter((a) => {
        if (!userId || userId === "default") return true;
        return a.userId === userId || !a.userId;
      });
      return all.slice(offset, offset + limit);
    },
    async getByFeedId(
      feedId: string,
      userId?: string,
      limit = 20,
      offset = 0,
    ): Promise<NewsArticle[]> {
      const all = Array.from(articles.values()).filter((a) => {
        if (a.feedId !== feedId) return false;
        if (!userId || userId === "default") return true;
        return a.userId === userId || !a.userId;
      });
      return all.slice(offset, offset + limit);
    },
    async getRecent(limit: number, userId?: string): Promise<NewsArticle[]> {
      const all = Array.from(articles.values()).filter((a) => {
        if (!userId || userId === "default") return true;
        return a.userId === userId || !a.userId;
      });
      return all.slice(0, limit);
    },
    async search(
      query: string,
      userId?: string,
      feedId?: string,
      limit = 20,
      offset = 0,
    ): Promise<NewsArticle[]> {
      const q = query.toLowerCase();
      return Array.from(articles.values())
        .filter((a) => {
          const matchesQuery =
            a.title.toLowerCase().includes(q) || a.summary?.toLowerCase().includes(q);
          const matchesFeed = feedId ? a.feedId === feedId : true;
          const matchesUser = !userId || userId === "default" || a.userId === userId || !a.userId;
          return matchesQuery && matchesFeed && matchesUser;
        })
        .slice(offset, offset + limit);
    },
    async getByUrlAndFeedId(url: string, feedId: string): Promise<NewsArticle | undefined> {
      return Array.from(articles.values()).find((a) => a.url === url && a.feedId === feedId);
    },
    async create(
      article: Omit<NewsArticle, "id"> & { id?: string },
      userId?: string,
    ): Promise<NewsArticle> {
      const created: NewsArticle = {
        id: article.id || `art-${articles.size + 1}`,
        userId: userId || article.userId || "default",
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
    async markAsRead(id: string, userId?: string): Promise<NewsArticle | undefined> {
      const article = await this.getById(id, userId);
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

  it("should create and fetch articles for specific user", async () => {
    const created = await articleService.createArticle(
      {
        feedId: "feed-1",
        title: "Tech News Today",
        url: "https://example.com/news1",
        summary: "Sample summary",
        fetchedAt: new Date().toISOString(),
        isRead: false,
      },
      "user-1",
    );

    expect(created.id).toBeDefined();
    expect(created.title).toBe("Tech News Today");
    expect(created.userId).toBe("user-1");

    const user1Articles = await articleService.getArticles("user-1");
    expect(user1Articles).toHaveLength(1);

    const user2Articles = await articleService.getArticles("user-2");
    expect(user2Articles).toHaveLength(0);
  });

  it("should filter search by feedId and user", async () => {
    await articleService.createArticle(
      {
        feedId: "feed-1",
        title: "AI Breakthrough",
        url: "https://example.com/news1",
        fetchedAt: new Date().toISOString(),
        isRead: false,
      },
      "user-1",
    );

    await articleService.createArticle(
      {
        feedId: "feed-2",
        title: "AI Developments",
        url: "https://example.com/news2",
        fetchedAt: new Date().toISOString(),
        isRead: false,
      },
      "user-2",
    );

    const searchUser1 = await articleService.searchArticles("AI", "user-1");
    expect(searchUser1).toHaveLength(1);
    expect(searchUser1[0].feedId).toBe("feed-1");

    const searchUser2 = await articleService.searchArticles("AI", "user-2");
    expect(searchUser2).toHaveLength(1);
    expect(searchUser2[0].feedId).toBe("feed-2");
  });

  it("should mark article as read for owner", async () => {
    const article = await articleService.createArticle(
      {
        feedId: "feed-1",
        title: "Reading Test",
        url: "https://example.com/test",
        fetchedAt: new Date().toISOString(),
        isRead: false,
      },
      "user-1",
    );

    const resUser2 = await articleService.markAsRead(article.id, "user-2");
    expect(resUser2.success).toBe(false);
    expect(resUser2.error).toBe("Article not found");

    const resUser1 = await articleService.markAsRead(article.id, "user-1");
    expect(resUser1.success).toBe(true);
    expect(resUser1.article?.isRead).toBe(true);
  });
});
