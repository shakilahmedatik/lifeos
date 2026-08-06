import type { NewRssFeedInput, NewsArticle, RssFeed } from "../domain/types.js";

export interface RssFeedRepository {
  getById(id: string): Promise<RssFeed | undefined>;
  getAll(): Promise<RssFeed[]>;
  getActive(): Promise<RssFeed[]>;
  getByUrl(url: string): Promise<RssFeed | undefined>;
  create(id: string, input: NewRssFeedInput): Promise<RssFeed>;
  update(id: string, patch: Partial<NewRssFeedInput>): Promise<RssFeed | undefined>;
  updateStatus(id: string, status: "active" | "inactive"): Promise<RssFeed | undefined>;
  updateFetchStatus(
    id: string,
    lastFetchedAt: string,
    lastFetchError?: string,
  ): Promise<RssFeed | undefined>;
  delete(id: string): Promise<boolean>;
}

export interface NewsArticleRepository {
  getById(id: string): Promise<NewsArticle | undefined>;
  getAll(limit?: number, offset?: number): Promise<NewsArticle[]>;
  getByFeedId(feedId: string, limit?: number, offset?: number): Promise<NewsArticle[]>;
  getRecent(limit: number): Promise<NewsArticle[]>;
  search(query: string, limit?: number, offset?: number): Promise<NewsArticle[]>;
  getByUrlAndFeedId(url: string, feedId: string): Promise<NewsArticle | undefined>;
  create(article: Omit<NewsArticle, "id"> & { id?: string }): Promise<NewsArticle>;
  markAsRead(id: string): Promise<NewsArticle | undefined>;
  deleteOlderThan(date: string): Promise<number>;
}
