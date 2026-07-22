import type { NewRssFeedInput, NewsArticle, RssFeed } from "../domain/types.js";

export interface RssFeedRepository {
  getById(id: string): RssFeed | undefined;
  getAll(): RssFeed[];
  getActive(): RssFeed[];
  getByUrl(url: string): RssFeed | undefined;
  create(id: string, input: NewRssFeedInput): RssFeed;
  update(id: string, patch: Partial<NewRssFeedInput>): RssFeed | undefined;
  updateStatus(id: string, status: "active" | "inactive"): RssFeed | undefined;
  updateFetchStatus(
    id: string,
    lastFetchedAt: string,
    lastFetchError?: string,
  ): RssFeed | undefined;
  delete(id: string): boolean;
}

export interface NewsArticleRepository {
  getById(id: string): NewsArticle | undefined;
  getAll(limit?: number, offset?: number): NewsArticle[];
  getByFeedId(feedId: string, limit?: number, offset?: number): NewsArticle[];
  getRecent(limit: number): NewsArticle[];
  search(query: string, limit?: number, offset?: number): NewsArticle[];
  getByUrlAndFeedId(url: string, feedId: string): NewsArticle | undefined;
  create(article: Omit<NewsArticle, "id"> & { id?: string }): NewsArticle;
  markAsRead(id: string): NewsArticle | undefined;
  deleteOlderThan(date: string): number;
}
