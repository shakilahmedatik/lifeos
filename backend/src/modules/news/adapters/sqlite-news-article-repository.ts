import type Database from "better-sqlite3";

import type { NewsArticle } from "../domain/types.js";
import type { NewsArticleRepository } from "../ports/repositories.js";

export function createSqliteNewsArticleRepository(db: Database.Database): NewsArticleRepository {
  return {
    getById(id: string): NewsArticle | undefined {
      const row = db.prepare("SELECT * FROM news_articles WHERE id = ?").get(id) as
        | Record<string, unknown>
        | undefined;
      if (!row) return undefined;
      return mapRowToNewsArticle(row);
    },

    getAll(limit = 20, offset = 0): NewsArticle[] {
      const rows = db
        .prepare("SELECT * FROM news_articles ORDER BY published_at DESC LIMIT ? OFFSET ?")
        .all(limit, offset) as Record<string, unknown>[];
      return rows.map(mapRowToNewsArticle);
    },

    getByFeedId(feedId: string, limit = 20, offset = 0): NewsArticle[] {
      const rows = db
        .prepare(
          "SELECT * FROM news_articles WHERE feed_id = ? ORDER BY published_at DESC LIMIT ? OFFSET ?",
        )
        .all(feedId, limit, offset) as Record<string, unknown>[];
      return rows.map(mapRowToNewsArticle);
    },

    getRecent(limit: number): NewsArticle[] {
      const rows = db
        .prepare("SELECT * FROM news_articles ORDER BY published_at DESC LIMIT ?")
        .all(limit) as Record<string, unknown>[];
      return rows.map(mapRowToNewsArticle);
    },

    search(query: string, limit = 20, offset = 0): NewsArticle[] {
      const rows = db
        .prepare(
          "SELECT * FROM news_articles WHERE title LIKE ? OR summary LIKE ? ORDER BY published_at DESC LIMIT ? OFFSET ?",
        )
        .all(`%${query}%`, `%${query}%`, limit, offset) as Record<string, unknown>[];
      return rows.map(mapRowToNewsArticle);
    },

    getByUrlAndFeedId(url: string, feedId: string): NewsArticle | undefined {
      const row = db
        .prepare("SELECT * FROM news_articles WHERE url = ? AND feed_id = ?")
        .get(url, feedId) as Record<string, unknown> | undefined;
      if (!row) return undefined;
      return mapRowToNewsArticle(row);
    },

    create(article: Omit<NewsArticle, "id"> & { id?: string }): NewsArticle {
      const id = article.id || crypto.randomUUID();
      db.prepare(
        "INSERT INTO news_articles (id, feed_id, title, url, summary, published_at, fetched_at, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        id,
        article.feedId,
        article.title,
        article.url,
        article.summary || null,
        article.publishedAt || null,
        article.fetchedAt,
        article.isRead ? 1 : 0,
      );

      return {
        id,
        feedId: article.feedId,
        title: article.title,
        url: article.url,
        summary: article.summary,
        publishedAt: article.publishedAt,
        fetchedAt: article.fetchedAt,
        isRead: article.isRead,
      };
    },

    markAsRead(id: string): NewsArticle | undefined {
      db.prepare("UPDATE news_articles SET is_read = 1 WHERE id = ?").run(id);
      return this.getById(id);
    },

    deleteOlderThan(date: string): number {
      const result = db.prepare("DELETE FROM news_articles WHERE published_at < ?").run(date);
      return result.changes;
    },
  };
}

function mapRowToNewsArticle(row: Record<string, unknown>): NewsArticle {
  return {
    id: row.id as string,
    feedId: row.feed_id as string,
    title: row.title as string,
    url: row.url as string,
    summary: (row.summary as string) || undefined,
    publishedAt: (row.published_at as string) || undefined,
    fetchedAt: row.fetched_at as string,
    isRead: (row.is_read as number) === 1,
  };
}
