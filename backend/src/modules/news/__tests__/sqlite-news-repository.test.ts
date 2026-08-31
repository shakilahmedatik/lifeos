import { type Client, createClient } from "@libsql/client";
import { beforeEach, describe, expect, it } from "vitest";
import { createSqliteNewsArticleRepository } from "../adapters/sqlite/sqlite-news-article-repository.js";
import { createSqliteRssFeedRepository } from "../adapters/sqlite/sqlite-rss-feed-repository.js";

async function createTestClient(): Promise<Client> {
  const client = createClient({ url: ":memory:" });
  await client.execute(`
    CREATE TABLE rss_feeds (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      icon_url TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      last_fetched_at TEXT,
      last_fetch_error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );
  `);
  await client.execute(`
    CREATE INDEX idx_rss_feeds_user_id ON rss_feeds(user_id);
    CREATE INDEX idx_rss_feeds_user_url ON rss_feeds(user_id, url);
  `);
  await client.execute(`
    CREATE TABLE news_articles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT '',
      feed_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      summary TEXT,
      published_at TEXT,
      fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_read INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,
      FOREIGN KEY (feed_id) REFERENCES rss_feeds(id) ON DELETE CASCADE,
      UNIQUE(user_id, url, feed_id)
    );
  `);
  await client.execute(`
    CREATE INDEX idx_news_articles_user_id ON news_articles(user_id);
    CREATE INDEX idx_news_articles_feed_id ON news_articles(feed_id);
    CREATE INDEX idx_news_articles_fetched_at ON news_articles(fetched_at);
  `);
  return client;
}

describe("SqliteNewsRepositories - User Scoping", () => {
  let client: Client;
  let feedRepo: ReturnType<typeof createSqliteRssFeedRepository>;
  let articleRepo: ReturnType<typeof createSqliteNewsArticleRepository>;

  beforeEach(async () => {
    client = await createTestClient();
    feedRepo = createSqliteRssFeedRepository(client);
    articleRepo = createSqliteNewsArticleRepository(client);
  });

  it("should auto-seed default feeds per user on first getAll", async () => {
    const user1Feeds = await feedRepo.getAll("user-1");
    expect(user1Feeds.length).toBe(3);
    expect(user1Feeds.every((f) => f.userId === "user-1")).toBe(true);

    const user2Feeds = await feedRepo.getAll("user-2");
    expect(user2Feeds.length).toBe(3);
    expect(user2Feeds.every((f) => f.userId === "user-2")).toBe(true);

    // Feeds should have different IDs for different users
    const user1Ids = user1Feeds.map((f) => f.id);
    const user2Ids = user2Feeds.map((f) => f.id);
    expect(user1Ids.some((id) => user2Ids.includes(id))).toBe(false);
  });

  it("should isolate custom feeds created by different users", async () => {
    const feed1 = await feedRepo.create(
      "feed-u1-custom",
      { title: "User 1 Custom", url: "https://user1.com/rss" },
      "user-1",
    );
    const feed2 = await feedRepo.create(
      "feed-u2-custom",
      { title: "User 2 Custom", url: "https://user2.com/rss" },
      "user-2",
    );

    expect(feed1.userId).toBe("user-1");
    expect(feed2.userId).toBe("user-2");

    const getForUser1 = await feedRepo.getById("feed-u1-custom", "user-1");
    expect(getForUser1).toBeDefined();

    // User 2 cannot get User 1's feed
    const getForUser2 = await feedRepo.getById("feed-u1-custom", "user-2");
    expect(getForUser2).toBeUndefined();

    // Both users can add the exact same feed URL
    const duplicateUrlFeedForUser2 = await feedRepo.create(
      "feed-u2-duplicate",
      { title: "User 2 Same URL", url: "https://user1.com/rss" },
      "user-2",
    );
    expect(duplicateUrlFeedForUser2).toBeDefined();
    expect(duplicateUrlFeedForUser2.url).toBe("https://user1.com/rss");
  });

  it("should isolate news articles per user", async () => {
    const feed1 = await feedRepo.create(
      "feed-u1",
      { title: "User 1 Tech", url: "https://u1.com/rss" },
      "user-1",
    );
    const feed2 = await feedRepo.create(
      "feed-u2",
      { title: "User 2 Tech", url: "https://u2.com/rss" },
      "user-2",
    );

    const art1 = await articleRepo.create(
      {
        feedId: feed1.id,
        title: "User 1 Exclusive Story",
        url: "https://u1.com/story1",
        fetchedAt: new Date().toISOString(),
        isRead: false,
      },
      "user-1",
    );

    const art2 = await articleRepo.create(
      {
        feedId: feed2.id,
        title: "User 2 Exclusive Story",
        url: "https://u2.com/story2",
        fetchedAt: new Date().toISOString(),
        isRead: false,
      },
      "user-2",
    );

    // User 1 only sees article 1
    const user1Articles = await articleRepo.getAll("user-1");
    expect(user1Articles.map((a) => a.id)).toContain(art1.id);
    expect(user1Articles.map((a) => a.id)).not.toContain(art2.id);

    // User 2 only sees article 2
    const user2Articles = await articleRepo.getAll("user-2");
    expect(user2Articles.map((a) => a.id)).toContain(art2.id);
    expect(user2Articles.map((a) => a.id)).not.toContain(art1.id);

    // User 1 recent
    const user1Recent = await articleRepo.getRecent(5, "user-1");
    expect(user1Recent).toHaveLength(1);
    expect(user1Recent[0].id).toBe(art1.id);

    // User 2 cannot mark User 1's article as read
    const markResult = await articleRepo.markAsRead(art1.id, "user-2");
    expect(markResult).toBeUndefined();

    // User 1 can mark as read
    const user1MarkResult = await articleRepo.markAsRead(art1.id, "user-1");
    expect(user1MarkResult?.isRead).toBe(true);
  });
});
