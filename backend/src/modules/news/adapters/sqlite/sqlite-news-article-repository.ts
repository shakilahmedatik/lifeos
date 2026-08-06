import type { Client } from "@libsql/client";

import type { NewsArticle } from "../../domain/types.js";
import type { NewsArticleRepository } from "../../ports/repositories.js";

export function createSqliteNewsArticleRepository(client: Client): NewsArticleRepository {
  return {
    async getById(id: string): Promise<NewsArticle | undefined> {
      const res = await client.execute({
        sql: "SELECT * FROM news_articles WHERE id = ?",
        args: [id],
      });
      const row = res.rows[0] as unknown as Record<string, unknown> | undefined;
      if (!row) return undefined;
      return mapRowToNewsArticle(row);
    },

    async getAll(limit = 20, offset = 0): Promise<NewsArticle[]> {
      const res = await client.execute({
        sql: "SELECT * FROM news_articles ORDER BY published_at DESC LIMIT ? OFFSET ?",
        args: [limit, offset],
      });
      const rows = res.rows as unknown as Record<string, unknown>[];
      return rows.map(mapRowToNewsArticle);
    },

    async getByFeedId(feedId: string, limit = 20, offset = 0): Promise<NewsArticle[]> {
      const res = await client.execute({
        sql: "SELECT * FROM news_articles WHERE feed_id = ? ORDER BY published_at DESC LIMIT ? OFFSET ?",
        args: [feedId, limit, offset],
      });
      const rows = res.rows as unknown as Record<string, unknown>[];
      return rows.map(mapRowToNewsArticle);
    },

    async getRecent(limit: number): Promise<NewsArticle[]> {
      const res = await client.execute({
        sql: "SELECT * FROM news_articles ORDER BY published_at DESC LIMIT ?",
        args: [limit],
      });
      const rows = res.rows as unknown as Record<string, unknown>[];
      return rows.map(mapRowToNewsArticle);
    },

    async search(
      query: string,
      feedId?: string,
      limit = 20,
      offset = 0,
    ): Promise<NewsArticle[]> {
      const sanitizedQuery = query.replace(/[%_]/g, "\\$&").trim();
      if (!sanitizedQuery) {
        if (feedId) return this.getByFeedId(feedId, limit, offset);
        return this.getAll(limit, offset);
      }

      let sql =
        "SELECT * FROM news_articles WHERE (title LIKE ? ESCAPE '\\' OR summary LIKE ? ESCAPE '\\')";
      const args: (string | number)[] = [`%${sanitizedQuery}%`, `%${sanitizedQuery}%`];

      if (feedId) {
        sql += " AND feed_id = ?";
        args.push(feedId);
      }

      sql += " ORDER BY published_at DESC LIMIT ? OFFSET ?";
      args.push(limit, offset);

      const res = await client.execute({ sql, args });
      const rows = res.rows as unknown as Record<string, unknown>[];
      return rows.map(mapRowToNewsArticle);
    },

    async getByUrlAndFeedId(url: string, feedId: string): Promise<NewsArticle | undefined> {
      const res = await client.execute({
        sql: "SELECT * FROM news_articles WHERE url = ? AND feed_id = ?",
        args: [url, feedId],
      });
      const row = res.rows[0] as unknown as Record<string, unknown> | undefined;
      if (!row) return undefined;
      return mapRowToNewsArticle(row);
    },

    async create(article: Omit<NewsArticle, "id"> & { id?: string }): Promise<NewsArticle> {
      const id = article.id || crypto.randomUUID();
      await client.execute({
        sql: "INSERT INTO news_articles (id, feed_id, title, url, summary, published_at, fetched_at, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        args: [
          id,
          article.feedId,
          article.title,
          article.url,
          article.summary || null,
          article.publishedAt || null,
          article.fetchedAt,
          article.isRead ? 1 : 0,
        ],
      });

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

    async markAsRead(id: string): Promise<NewsArticle | undefined> {
      await client.execute({
        sql: "UPDATE news_articles SET is_read = 1 WHERE id = ?",
        args: [id],
      });
      return await this.getById(id);
    },

    async deleteOlderThan(date: string): Promise<number> {
      const res = await client.execute({
        sql: "DELETE FROM news_articles WHERE published_at < ?",
        args: [date],
      });
      return res.rowsAffected;
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
