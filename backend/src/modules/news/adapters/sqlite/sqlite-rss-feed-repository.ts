import type { Client } from "@libsql/client";

import type { NewRssFeedInput, RssFeed } from "../../domain/types.js";
import type { RssFeedRepository } from "../../ports/repositories.js";

const DEFAULT_RSS_FEEDS: Array<{ title: string; url: string }> = [
  { title: "Hacker News", url: "https://news.ycombinator.com/rss" },
  { title: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { title: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
];

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

export function createSqliteRssFeedRepository(
  client: Client,
  onFeedsCreated?: (feedIds: string[]) => Promise<void> | void,
): RssFeedRepository {
  const ensuringUsers = new Set<string>();

  async function ensureDefaults(userId?: string): Promise<void> {
    const uid = userId !== undefined && userId.trim().length > 0 ? userId.trim() : "default";
    if (ensuringUsers.has(uid)) return;
    ensuringUsers.add(uid);

    try {
      const filter = getUserFilter(uid);
      const res = await client.execute({
        sql: `SELECT COUNT(*) as count FROM rss_feeds WHERE ${filter.clause}`,
        args: filter.args,
      });
      const count = Number(res.rows[0]?.count ?? 0);
      if (count === 0) {
        const now = new Date().toISOString();
        const createdIds: string[] = [];
        for (const feed of DEFAULT_RSS_FEEDS) {
          const feedId = `feed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          await client.execute({
            sql: `INSERT INTO rss_feeds (id, user_id, title, url, status, created_at, updated_at)
                  VALUES (?, ?, ?, ?, 'active', ?, ?)`,
            args: [feedId, uid, feed.title, feed.url, now, now],
          });
          createdIds.push(feedId);
        }
        if (onFeedsCreated && createdIds.length > 0) {
          await onFeedsCreated(createdIds);
        }
      }
    } catch {
      // Ignore initial seeding conflicts
    } finally {
      ensuringUsers.delete(uid);
    }
  }

  return {
    async getById(id: string, userId?: string): Promise<RssFeed | undefined> {
      let sql = "SELECT * FROM rss_feeds WHERE id = ? AND deleted_at IS NULL";
      const args: (string | number)[] = [id];

      if (userId !== undefined) {
        const filter = getUserFilter(userId);
        sql += ` AND ${filter.clause}`;
        args.push(...filter.args);
      }

      const res = await client.execute({ sql, args });
      const row = res.rows[0] as unknown as Record<string, unknown> | undefined;
      if (!row) return undefined;
      return mapRowToRssFeed(row);
    },

    async getAll(userId?: string): Promise<RssFeed[]> {
      if (userId !== undefined) {
        await ensureDefaults(userId);
        const filter = getUserFilter(userId);
        const res = await client.execute({
          sql: `SELECT * FROM rss_feeds WHERE ${filter.clause} AND deleted_at IS NULL ORDER BY created_at DESC`,
          args: filter.args,
        });
        const rows = res.rows as unknown as Record<string, unknown>[];
        return rows.map(mapRowToRssFeed);
      }

      const res = await client.execute("SELECT * FROM rss_feeds WHERE deleted_at IS NULL ORDER BY created_at DESC");
      const rows = res.rows as unknown as Record<string, unknown>[];
      return rows.map(mapRowToRssFeed);
    },

    async getActive(userId?: string): Promise<RssFeed[]> {
      if (userId !== undefined) {
        await ensureDefaults(userId);
        const filter = getUserFilter(userId);
        const res = await client.execute({
          sql: `SELECT * FROM rss_feeds WHERE status = 'active' AND ${filter.clause} AND deleted_at IS NULL ORDER BY created_at DESC`,
          args: filter.args,
        });
        const rows = res.rows as unknown as Record<string, unknown>[];
        return rows.map(mapRowToRssFeed);
      }

      const res = await client.execute(
        "SELECT * FROM rss_feeds WHERE status = 'active' AND deleted_at IS NULL ORDER BY created_at DESC",
      );
      const rows = res.rows as unknown as Record<string, unknown>[];
      return rows.map(mapRowToRssFeed);
    },

    async getAllActiveAcrossUsers(): Promise<RssFeed[]> {
      const res = await client.execute(
        "SELECT * FROM rss_feeds WHERE status = 'active' AND deleted_at IS NULL ORDER BY created_at DESC",
      );
      const rows = res.rows as unknown as Record<string, unknown>[];
      return rows.map(mapRowToRssFeed);
    },

    async getByUrl(url: string, userId?: string): Promise<RssFeed | undefined> {
      let sql = "SELECT * FROM rss_feeds WHERE url = ? AND deleted_at IS NULL";
      const args: (string | number)[] = [url];

      if (userId !== undefined) {
        const filter = getUserFilter(userId);
        sql += ` AND ${filter.clause}`;
        args.push(...filter.args);
      }

      const res = await client.execute({ sql, args });
      const row = res.rows[0] as unknown as Record<string, unknown> | undefined;
      if (!row) return undefined;
      return mapRowToRssFeed(row);
    },

    async create(id: string, input: NewRssFeedInput, userId?: string): Promise<RssFeed> {
      const uid = userId !== undefined && userId.trim().length > 0 ? userId.trim() : "default";
      const now = new Date().toISOString();
      await client.execute({
        sql: "INSERT INTO rss_feeds (id, user_id, title, url, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)",
        args: [id, uid, input.title, input.url, now, now],
      });

      return {
        id,
        userId: uid,
        title: input.title,
        url: input.url,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
    },

    async update(
      id: string,
      patch: Partial<NewRssFeedInput>,
      userId?: string,
    ): Promise<RssFeed | undefined> {
      const existing = await this.getById(id, userId);
      if (!existing) return undefined;

      const updates: string[] = [];
      const values: (string | number | null)[] = [];

      if (patch.title !== undefined) {
        updates.push("title = ?");
        values.push(patch.title);
      }
      if (patch.url !== undefined) {
        updates.push("url = ?");
        values.push(patch.url);
      }

      if (updates.length === 0) return existing;

      updates.push("updated_at = ?");
      values.push(new Date().toISOString());
      values.push(id);

      let sql = `UPDATE rss_feeds SET ${updates.join(", ")} WHERE id = ? AND deleted_at IS NULL`;
      if (userId !== undefined) {
        const filter = getUserFilter(userId);
        sql += ` AND ${filter.clause}`;
        values.push(...filter.args);
      }

      await client.execute({ sql, args: values });
      return await this.getById(id, userId);
    },

    async updateStatus(
      id: string,
      status: "active" | "inactive",
      userId?: string,
    ): Promise<RssFeed | undefined> {
      const now = new Date().toISOString();
      let sql = "UPDATE rss_feeds SET status = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL";
      const args: (string | number)[] = [status, now, id];

      if (userId !== undefined) {
        const filter = getUserFilter(userId);
        sql += ` AND ${filter.clause}`;
        args.push(...filter.args);
      }

      await client.execute({ sql, args });
      return await this.getById(id, userId);
    },

    async updateFetchStatus(
      id: string,
      lastFetchedAt: string,
      lastFetchError?: string,
    ): Promise<RssFeed | undefined> {
      const now = new Date().toISOString();
      await client.execute({
        sql: "UPDATE rss_feeds SET last_fetched_at = ?, last_fetch_error = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
        args: [lastFetchedAt, lastFetchError || null, now, id],
      });
      const res = await client.execute({
        sql: "SELECT * FROM rss_feeds WHERE id = ? AND deleted_at IS NULL",
        args: [id],
      });
      const row = res.rows[0] as unknown as Record<string, unknown> | undefined;
      return row ? mapRowToRssFeed(row) : undefined;
    },

    async delete(id: string, userId?: string): Promise<boolean> {
      const now = new Date().toISOString();
      let articlesSql = "UPDATE news_articles SET deleted_at = ?, updated_at = ? WHERE feed_id = ? AND deleted_at IS NULL";
      let feedsSql = "UPDATE rss_feeds SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL";
      const args: (string | number)[] = [now, now, id];

      if (userId !== undefined) {
        const filter = getUserFilter(userId);
        articlesSql += ` AND ${filter.clause}`;
        feedsSql += ` AND ${filter.clause}`;
        args.push(...filter.args);
      }

      await client.execute({ sql: articlesSql, args });
      const res = await client.execute({ sql: feedsSql, args });
      return res.rowsAffected > 0;
    },
  };
}

function mapRowToRssFeed(row: Record<string, unknown>): RssFeed {
  return {
    id: row.id as string,
    userId: (row.user_id as string) || undefined,
    title: row.title as string,
    url: row.url as string,
    status: row.status as "active" | "inactive",
    lastFetchedAt: (row.last_fetched_at as string) || undefined,
    lastFetchError: (row.last_fetch_error as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
