-- Migration 008: User scoped RSS feeds and news articles

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS rss_feeds_v8 (
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

INSERT INTO rss_feeds_v8 (id, user_id, name, title, url, category, icon_url, enabled, status, last_fetched_at, last_fetch_error, created_at, updated_at)
SELECT id, user_id, name, title, url, category, icon_url, enabled, status, last_fetched_at, last_fetch_error, created_at, updated_at FROM rss_feeds;

DROP TABLE rss_feeds;
ALTER TABLE rss_feeds_v8 RENAME TO rss_feeds;

CREATE INDEX IF NOT EXISTS idx_rss_feeds_user_id ON rss_feeds(user_id);
CREATE INDEX IF NOT EXISTS idx_rss_feeds_user_url ON rss_feeds(user_id, url);

CREATE TABLE IF NOT EXISTS news_articles_v8 (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT '',
  feed_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  summary TEXT,
  published_at TEXT,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_read INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (feed_id) REFERENCES rss_feeds(id) ON DELETE CASCADE,
  UNIQUE(user_id, url, feed_id)
);

INSERT INTO news_articles_v8 (id, user_id, feed_id, title, url, summary, published_at, fetched_at, is_read)
SELECT id, user_id, feed_id, title, url, summary, published_at, fetched_at, is_read FROM news_articles;

DROP TABLE news_articles;
ALTER TABLE news_articles_v8 RENAME TO news_articles;

CREATE INDEX IF NOT EXISTS idx_news_articles_user_id ON news_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_feed_id ON news_articles(feed_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_fetched_at ON news_articles(fetched_at);

PRAGMA foreign_keys = ON;
