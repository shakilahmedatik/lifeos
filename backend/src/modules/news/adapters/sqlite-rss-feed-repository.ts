import type Database from "better-sqlite3";

import type { NewRssFeedInput, RssFeed } from "../domain/types.js";
import type { RssFeedRepository } from "../ports/repositories.js";

export function createSqliteRssFeedRepository(db: Database.Database): RssFeedRepository {
  return {
    getById(id: string): RssFeed | undefined {
      const row = db.prepare("SELECT * FROM rss_feeds WHERE id = ?").get(id) as
        | Record<string, unknown>
        | undefined;
      if (!row) return undefined;
      return mapRowToRssFeed(row);
    },

    getAll(): RssFeed[] {
      const rows = db.prepare("SELECT * FROM rss_feeds ORDER BY created_at DESC").all() as Record<
        string,
        unknown
      >[];
      return rows.map(mapRowToRssFeed);
    },

    getActive(): RssFeed[] {
      const rows = db
        .prepare("SELECT * FROM rss_feeds WHERE status = 'active' ORDER BY created_at DESC")
        .all() as Record<string, unknown>[];
      return rows.map(mapRowToRssFeed);
    },

    getByUrl(url: string): RssFeed | undefined {
      const row = db.prepare("SELECT * FROM rss_feeds WHERE url = ?").get(url) as
        | Record<string, unknown>
        | undefined;
      if (!row) return undefined;
      return mapRowToRssFeed(row);
    },

    create(id: string, input: NewRssFeedInput): RssFeed {
      const now = new Date().toISOString();
      db.prepare(
        "INSERT INTO rss_feeds (id, title, url, status, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?)",
      ).run(id, input.title, input.url, now, now);

      return {
        id,
        title: input.title,
        url: input.url,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
    },

    update(id: string, patch: Partial<NewRssFeedInput>): RssFeed | undefined {
      const existing = this.getById(id);
      if (!existing) return undefined;

      const updates: string[] = [];
      const values: unknown[] = [];

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

      db.prepare(`UPDATE rss_feeds SET ${updates.join(", ")} WHERE id = ?`).run(...values);

      return this.getById(id);
    },

    updateStatus(id: string, status: "active" | "inactive"): RssFeed | undefined {
      const now = new Date().toISOString();
      db.prepare("UPDATE rss_feeds SET status = ?, updated_at = ? WHERE id = ?").run(
        status,
        now,
        id,
      );
      return this.getById(id);
    },

    updateFetchStatus(
      id: string,
      lastFetchedAt: string,
      lastFetchError?: string,
    ): RssFeed | undefined {
      const now = new Date().toISOString();
      db.prepare(
        "UPDATE rss_feeds SET last_fetched_at = ?, last_fetch_error = ?, updated_at = ? WHERE id = ?",
      ).run(lastFetchedAt, lastFetchError || null, now, id);
      return this.getById(id);
    },

    delete(id: string): boolean {
      const result = db.prepare("DELETE FROM rss_feeds WHERE id = ?").run(id);
      return result.changes > 0;
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
