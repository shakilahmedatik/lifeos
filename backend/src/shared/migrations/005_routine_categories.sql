-- Migration 005: Routine Categories for Routine Module

CREATE TABLE IF NOT EXISTS routine_categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_routine_categories_user_id ON routine_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_categories_sort_order ON routine_categories(sort_order);

-- Update tasks table to remove restrictive category CHECK constraint
PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS tasks_v5 (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('todo', 'planned', 'in_progress', 'done', 'missed', 'cancelled', 'skipped')),
  notes TEXT,
  reminder_minutes_before INTEGER,
  reminder_sound INTEGER NOT NULL DEFAULT 1,
  recurrence TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekdays', 'weekly')),
  subtasks TEXT DEFAULT '[]',
  reference_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

INSERT INTO tasks_v5 SELECT id, user_id, title, category, date, start_time, end_time, status, notes, reminder_minutes_before, reminder_sound, recurrence, subtasks, reference_id, created_at, updated_at, deleted_at FROM tasks;
DROP TABLE tasks;
ALTER TABLE tasks_v5 RENAME TO tasks;

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence ON tasks(recurrence);

PRAGMA foreign_keys = ON;
