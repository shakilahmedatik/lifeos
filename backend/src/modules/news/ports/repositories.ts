import type { NewRssFeedInput, NewsArticle, RssFeed } from "../domain/types.js";

export interface RssFeedRepository {
  getById(id: string, userId?: string): Promise<RssFeed | undefined>;
  getAll(userId?: string): Promise<RssFeed[]>;
  getActive(userId?: string): Promise<RssFeed[]>;
  getAllActiveAcrossUsers(): Promise<RssFeed[]>;
  getByUrl(url: string, userId?: string): Promise<RssFeed | undefined>;
  create(id: string, input: NewRssFeedInput, userId?: string): Promise<RssFeed>;
  update(
    id: string,
    patch: Partial<NewRssFeedInput>,
    userId?: string,
  ): Promise<RssFeed | undefined>;
  updateStatus(
    id: string,
    status: "active" | "inactive",
    userId?: string,
  ): Promise<RssFeed | undefined>;
  updateFetchStatus(
    id: string,
    lastFetchedAt: string,
    lastFetchError?: string,
  ): Promise<RssFeed | undefined>;
  delete(id: string, userId?: string): Promise<boolean>;
}

export interface NewsArticleRepository {
  getById(id: string, userId?: string): Promise<NewsArticle | undefined>;
  getAll(userId?: string, limit?: number, offset?: number): Promise<NewsArticle[]>;
  getByFeedId(
    feedId: string,
    userId?: string,
    limit?: number,
    offset?: number,
  ): Promise<NewsArticle[]>;
  getRecent(limit: number, userId?: string): Promise<NewsArticle[]>;
  search(
    query: string,
    userId?: string,
    feedId?: string,
    limit?: number,
    offset?: number,
  ): Promise<NewsArticle[]>;
  getByUrlAndFeedId(url: string, feedId: string): Promise<NewsArticle | undefined>;
  create(article: Omit<NewsArticle, "id"> & { id?: string }, userId?: string): Promise<NewsArticle>;
  markAsRead(id: string, userId?: string): Promise<NewsArticle | undefined>;
  deleteOlderThan(date: string): Promise<number>;
}
