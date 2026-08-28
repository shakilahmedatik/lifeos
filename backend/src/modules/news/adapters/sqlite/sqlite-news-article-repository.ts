import type { Client } from "@libsql/client";

import type { NewsArticle } from "../../domain/types.js";
import type { NewsArticleRepository } from "../../ports/repositories.js";

function getUserFilter(userId?: string): { clause: string; args: string[] } {
  const uid = userId !== undefined ? userId.trim() : "default";
  if (uid === "default" || uid === "") {
    return {
      clause: "(user_id = 'default' OR user_id = '' OR user_id IS NULL)",
      args: [],
    };
  }
  return {
    clause: "user_id = ?",
    args: [uid],
  };
}

export function createSqliteNewsArticleRepository(client: Client): NewsArticleRepository {
  return {
    async getById(id: string, userId?: string): Promise<NewsArticle | undefined> {
      let sql = "SELECT * FROM news_articles WHERE id = ?";
      const args: (string | number)[] = [id];

      if (userId !== undefined) {
        const filter = getUserFilter(userId);
        sql += ` AND ${filter.clause}`;
        args.push(...filter.args);
      }

      const res = await client.execute({ sql, args });
      const row = res.rows[0] as unknown as Record<string, unknown> | undefined;
      if (!row) return undefined;
      return mapRowToNewsArticle(row);
    },

    async getAll(userId?: string, limit = 20, offset = 0): Promise<NewsArticle[]> {
      let sql = "SELECT * FROM news_articles";
      const args: (string | number)[] = [];

      if (userId !== undefined) {
        const filter = getUserFilter(userId);
        sql += ` WHERE ${filter.clause}`;
        args.push(...filter.args);
      }

      sql += " ORDER BY published_at DESC, fetched_at DESC LIMIT ? OFFSET ?";
      args.push(limit, offset);

      const res = await client.execute({ sql, args });
      const rows = res.rows as unknown as Record<string, unknown>[];
      return rows.map(mapRowToNewsArticle);
    },

    async getByFeedId(
      feedId: string,
      userId?: string,
      limit = 20,
      offset = 0,
    ): Promise<NewsArticle[]> {
      let sql = "SELECT * FROM news_articles WHERE feed_id = ?";
      const args: (string | number)[] = [feedId];

      if (userId !== undefined) {
        const filter = getUserFilter(userId);
        sql += ` AND ${filter.clause}`;
        args.push(...filter.args);
      }

      sql += " ORDER BY published_at DESC, fetched_at DESC LIMIT ? OFFSET ?";
      args.push(limit, offset);

      const res = await client.execute({ sql, args });
      const rows = res.rows as unknown as Record<string, unknown>[];
      return rows.map(mapRowToNewsArticle);
    },

    async getRecent(limit: number, userId?: string): Promise<NewsArticle[]> {
      let sql = "SELECT * FROM news_articles";
      const args: (string | number)[] = [];

      if (userId !== undefined) {
        const filter = getUserFilter(userId);
        sql += ` WHERE ${filter.clause}`;
        args.push(...filter.args);
      }

      sql += " ORDER BY published_at DESC, fetched_at DESC LIMIT ?";
      args.push(limit);

      const res = await client.execute({ sql, args });
      const rows = res.rows as unknown as Record<string, unknown>[];
      return rows.map(mapRowToNewsArticle);
    },

    async search(
      query: string,
      userId?: string,
      feedId?: string,
      limit = 20,
      offset = 0,
    ): Promise<NewsArticle[]> {
      const sanitizedQuery = query.replace(/[%_]/g, "\\$&").trim();
      if (!sanitizedQuery) {
        if (feedId) return this.getByFeedId(feedId, userId, limit, offset);
        return this.getAll(userId, limit, offset);
      }

      let sql =
        "SELECT * FROM news_articles WHERE (title LIKE ? ESCAPE '\\' OR summary LIKE ? ESCAPE '\\')";
      const args: (string | number)[] = [`%${sanitizedQuery}%`, `%${sanitizedQuery}%`];

      if (userId !== undefined) {
        const filter = getUserFilter(userId);
        sql += ` AND ${filter.clause}`;
        args.push(...filter.args);
      }

      if (feedId) {
        sql += " AND feed_id = ?";
        args.push(feedId);
      }

      sql += " ORDER BY published_at DESC, fetched_at DESC LIMIT ? OFFSET ?";
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

    async create(
      article: Omit<NewsArticle, "id"> & { id?: string },
      userId?: string,
    ): Promise<NewsArticle> {
      const id = article.id || crypto.randomUUID();
      const uid =
        userId !== undefined && userId.trim().length > 0
          ? userId.trim()
          : (article.userId?.trim() || "default");

      await client.execute({
        sql: "INSERT INTO news_articles (id, user_id, feed_id, title, url, summary, published_at, fetched_at, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [
          id,
          uid,
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
        userId: uid,
        feedId: article.feedId,
        title: article.title,
        url: article.url,
        summary: article.summary,
        publishedAt: article.publishedAt,
        fetchedAt: article.fetchedAt,
        isRead: article.isRead,
      };
    },

    async markAsRead(id: string, userId?: string): Promise<NewsArticle | undefined> {
      let sql = "UPDATE news_articles SET is_read = 1 WHERE id = ?";
      const args: (string | number)[] = [id];

      if (userId !== undefined) {
        const filter = getUserFilter(userId);
        sql += ` AND ${filter.clause}`;
        args.push(...filter.args);
      }

      await client.execute({ sql, args });
      return await this.getById(id, userId);
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
    userId: (row.user_id as string) || undefined,
    feedId: row.feed_id as string,
    title: row.title as string,
    url: row.url as string,
    summary: (row.summary as string) || undefined,
    publishedAt: (row.published_at as string) || undefined,
    fetchedAt: row.fetched_at as string,
    isRead: (row.is_read as number) === 1,
  };
}
