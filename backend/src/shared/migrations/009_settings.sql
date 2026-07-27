-- Create user settings table for system preferences

CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
  currency TEXT NOT NULL DEFAULT '৳',
  polling_rate_seconds INTEGER NOT NULL DEFAULT 30,
  updated_at TEXT NOT NULL
);
