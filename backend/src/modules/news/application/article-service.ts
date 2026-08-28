import type { NewsArticle } from "../domain/types.js";
import type { NewsArticleRepository, RssFeedRepository } from "../ports/repositories.js";

export function createArticleService(
  articleRepository: NewsArticleRepository,
  _feedRepository: RssFeedRepository,
) {
  return {
    async getArticles(userId?: string, limit = 20, offset = 0): Promise<NewsArticle[]> {
      return await articleRepository.getAll(userId, limit, offset);
    },

    async getArticlesByFeedId(
      feedId: string,
      userId?: string,
      limit = 20,
      offset = 0,
    ): Promise<NewsArticle[]> {
      return await articleRepository.getByFeedId(feedId, userId, limit, offset);
    },

    async getRecentArticles(limit: number, userId?: string): Promise<NewsArticle[]> {
      return await articleRepository.getRecent(limit, userId);
    },

    async searchArticles(
      query: string,
      userId?: string,
      feedId?: string,
      limit = 20,
      offset = 0,
    ): Promise<NewsArticle[]> {
      return await articleRepository.search(query, userId, feedId, limit, offset);
    },

    async getArticleById(id: string, userId?: string): Promise<NewsArticle | undefined> {
      return await articleRepository.getById(id, userId);
    },

    async markAsRead(
      id: string,
      userId?: string,
    ): Promise<{ success: boolean; article?: NewsArticle; error?: string }> {
      const article = await articleRepository.getById(id, userId);
      if (!article) {
        return { success: false, error: "Article not found" };
      }

      const updated = await articleRepository.markAsRead(id, userId);
      return { success: true, article: updated };
    },

    async createArticle(
      article: Omit<NewsArticle, "id"> & { id?: string },
      userId?: string,
    ): Promise<NewsArticle> {
      return await articleRepository.create(article, userId);
    },

    async articleExists(url: string, feedId: string): Promise<boolean> {
      return (await articleRepository.getByUrlAndFeedId(url, feedId)) !== undefined;
    },

    async cleanupOldArticles(retentionDays = 30): Promise<number> {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      return await articleRepository.deleteOlderThan(cutoffDate.toISOString());
    },
  };
}
