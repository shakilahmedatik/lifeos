import type { NewsArticle } from "../domain/types.js";
import type { NewsArticleRepository, RssFeedRepository } from "../ports/repositories.js";

export function createArticleService(
  articleRepository: NewsArticleRepository,
  _feedRepository: RssFeedRepository,
) {
  return {
    getArticles(limit = 20, offset = 0): NewsArticle[] {
      return articleRepository.getAll(limit, offset);
    },

    getArticlesByFeedId(feedId: string, limit = 20, offset = 0): NewsArticle[] {
      return articleRepository.getByFeedId(feedId, limit, offset);
    },

    getRecentArticles(limit: number): NewsArticle[] {
      return articleRepository.getRecent(limit);
    },

    searchArticles(query: string, limit = 20, offset = 0): NewsArticle[] {
      return articleRepository.search(query, limit, offset);
    },

    getArticleById(id: string): NewsArticle | undefined {
      return articleRepository.getById(id);
    },

    markAsRead(id: string): { success: boolean; article?: NewsArticle; error?: string } {
      const article = articleRepository.getById(id);
      if (!article) {
        return { success: false, error: "Article not found" };
      }

      const updated = articleRepository.markAsRead(id);
      return { success: true, article: updated };
    },

    createArticle(article: Omit<NewsArticle, "id"> & { id?: string }): NewsArticle {
      return articleRepository.create(article);
    },

    articleExists(url: string, feedId: string): boolean {
      return articleRepository.getByUrlAndFeedId(url, feedId) !== undefined;
    },

    cleanupOldArticles(retentionDays = 30): number {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      return articleRepository.deleteOlderThan(cutoffDate.toISOString());
    },
  };
}
