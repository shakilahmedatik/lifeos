import type { NewsArticle } from "../domain/types.js";
import type { NewsArticleRepository, RssFeedRepository } from "../ports/repositories.js";

export function createArticleService(
  articleRepository: NewsArticleRepository,
  _feedRepository: RssFeedRepository,
) {
  return {
    async getArticles(limit = 20, offset = 0): Promise<NewsArticle[]> {
      return await articleRepository.getAll(limit, offset);
    },

    async getArticlesByFeedId(feedId: string, limit = 20, offset = 0): Promise<NewsArticle[]> {
      return await articleRepository.getByFeedId(feedId, limit, offset);
    },

    async getRecentArticles(limit: number): Promise<NewsArticle[]> {
      return await articleRepository.getRecent(limit);
    },

    async searchArticles(
      query: string,
      feedId?: string,
      limit = 20,
      offset = 0,
    ): Promise<NewsArticle[]> {
      return await articleRepository.search(query, feedId, limit, offset);
    },

    async getArticleById(id: string): Promise<NewsArticle | undefined> {
      return await articleRepository.getById(id);
    },

    async markAsRead(
      id: string,
    ): Promise<{ success: boolean; article?: NewsArticle; error?: string }> {
      const article = await articleRepository.getById(id);
      if (!article) {
        return { success: false, error: "Article not found" };
      }

      const updated = await articleRepository.markAsRead(id);
      return { success: true, article: updated };
    },

    async createArticle(article: Omit<NewsArticle, "id"> & { id?: string }): Promise<NewsArticle> {
      return await articleRepository.create(article);
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
