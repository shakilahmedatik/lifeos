-- Migration: Evolve habits and habit_logs for typed habit system
-- Adds type, config, icon, color, archived, sort_order to habits
-- Adds value, meta to habit_logs and relaxes unique constraint

-- Step 1: Add new columns to habits
ALTER TABLE habits ADD COLUMN type TEXT NOT NULL DEFAULT 'boolean'
  CHECK (type IN ('water', 'walking', 'prayer', 'timed', 'boolean'));
ALTER TABLE habits ADD COLUMN config TEXT NOT NULL DEFAULT '{"type":"boolean"}';
ALTER TABLE habits ADD COLUMN icon TEXT;
ALTER TABLE habits ADD COLUMN color TEXT;
ALTER TABLE habits ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
ALTER TABLE habits ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Step 2: Recreate habit_logs to drop UNIQUE(habit_id, date) constraint
-- and add value + meta columns
CREATE TABLE habit_logs_new (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL,
  date TEXT NOT NULL,
  value REAL NOT NULL DEFAULT 1,
  meta TEXT,
  logged_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

-- Migrate existing data (value=1 for all existing boolean-style logs)
INSERT INTO habit_logs_new (id, habit_id, date, value, logged_at)
  SELECT id, habit_id, date, 1, completed_at FROM habit_logs;

DROP TABLE habit_logs;
ALTER TABLE habit_logs_new RENAME TO habit_logs;

-- Step 3: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, date);
CREATE INDEX IF NOT EXISTS idx_habits_archived ON habits(archived);
CREATE INDEX IF NOT EXISTS idx_habits_sort_order ON habits(sort_order);
