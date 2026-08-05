-- Migration 023: Multi-user data isolation and Better Auth tables

-- Add user_id column (NOT NULL) to existing domain tables
ALTER TABLE routine_tasks ADD COLUMN user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE habits ADD COLUMN user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE habit_logs ADD COLUMN user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE notifications ADD COLUMN user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE workouts ADD COLUMN user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE workout_sessions ADD COLUMN user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE finance_accounts ADD COLUMN user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE finance_transactions ADD COLUMN user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE news_articles ADD COLUMN user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE rss_feeds ADD COLUMN user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE skill_areas ADD COLUMN user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE learning_logs ADD COLUMN user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE reminders ADD COLUMN user_id TEXT NOT NULL DEFAULT '';

-- Create indices on user_id for fast tenant queries
CREATE INDEX IF NOT EXISTS idx_routine_tasks_user_id ON routine_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_user_id ON finance_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_id ON finance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_user_id ON news_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_rss_feeds_user_id ON rss_feeds(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_areas_user_id ON skill_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_logs_user_id ON learning_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);

-- Better Auth Core Schema Tables
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  pin TEXT
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expiresAt TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt TEXT,
  refreshTokenExpiresAt TEXT,
  scope TEXT,
  password TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);
CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);
