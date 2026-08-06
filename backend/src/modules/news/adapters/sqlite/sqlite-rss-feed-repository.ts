import type { Client } from "@libsql/client";

import type { NewRssFeedInput, RssFeed } from "../../domain/types.js";
import type { RssFeedRepository } from "../../ports/repositories.js";

export function createSqliteRssFeedRepository(client: Client): RssFeedRepository {
  return {
    async getById(id: string): Promise<RssFeed | undefined> {
      const res = await client.execute({
        sql: "SELECT * FROM rss_feeds WHERE id = ?",
        args: [id],
      });
      const row = res.rows[0] as unknown as Record<string, unknown> | undefined;
      if (!row) return undefined;
      return mapRowToRssFeed(row);
    },

    async getAll(): Promise<RssFeed[]> {
      const res = await client.execute("SELECT * FROM rss_feeds ORDER BY created_at DESC");
      const rows = res.rows as unknown as Record<string, unknown>[];
      return rows.map(mapRowToRssFeed);
    },

    async getActive(): Promise<RssFeed[]> {
      const res = await client.execute(
        "SELECT * FROM rss_feeds WHERE status = 'active' ORDER BY created_at DESC",
      );
      const rows = res.rows as unknown as Record<string, unknown>[];
      return rows.map(mapRowToRssFeed);
    },

    async getByUrl(url: string): Promise<RssFeed | undefined> {
      const res = await client.execute({
        sql: "SELECT * FROM rss_feeds WHERE url = ?",
        args: [url],
      });
      const row = res.rows[0] as unknown as Record<string, unknown> | undefined;
      if (!row) return undefined;
      return mapRowToRssFeed(row);
    },

    async create(id: string, input: NewRssFeedInput): Promise<RssFeed> {
      const now = new Date().toISOString();
      await client.execute({
        sql: "INSERT INTO rss_feeds (id, title, url, status, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?)",
        args: [id, input.title, input.url, now, now],
      });

      return {
        id,
        title: input.title,
        url: input.url,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
    },

    async update(id: string, patch: Partial<NewRssFeedInput>): Promise<RssFeed | undefined> {
      const existing = await this.getById(id);
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

      await client.execute({
        sql: `UPDATE rss_feeds SET ${updates.join(", ")} WHERE id = ?`,
        args: values,
      });

      return await this.getById(id);
    },

    async updateStatus(id: string, status: "active" | "inactive"): Promise<RssFeed | undefined> {
      const now = new Date().toISOString();
      await client.execute({
        sql: "UPDATE rss_feeds SET status = ?, updated_at = ? WHERE id = ?",
        args: [status, now, id],
      });
      return await this.getById(id);
    },

    async updateFetchStatus(
      id: string,
      lastFetchedAt: string,
      lastFetchError?: string,
    ): Promise<RssFeed | undefined> {
      const now = new Date().toISOString();
      await client.execute({
        sql: "UPDATE rss_feeds SET last_fetched_at = ?, last_fetch_error = ?, updated_at = ? WHERE id = ?",
        args: [lastFetchedAt, lastFetchError || null, now, id],
      });
      return await this.getById(id);
    },

    async delete(id: string): Promise<boolean> {
      await client.execute({
        sql: "DELETE FROM news_articles WHERE feed_id = ?",
        args: [id],
      });
      const res = await client.execute({
        sql: "DELETE FROM rss_feeds WHERE id = ?",
        args: [id],
      });
      return res.rowsAffected > 0;
    },
  };
}

function mapRowToRssFeed(row: Record<string, unknown>): RssFeed {
  return {
    id: row.id as string,
    title: row.title as string,
    url: row.url as string,
    status: row.status as "active" | "inactive",
    lastFetchedAt: (row.last_fetched_at as string) || undefined,
    lastFetchError: (row.last_fetch_error as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
