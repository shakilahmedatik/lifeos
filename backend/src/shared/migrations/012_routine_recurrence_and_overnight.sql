PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS tasks_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('work', 'workout', 'learning', 'habit', 'personal', 'general')),
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'in_progress', 'done', 'skipped')),
  notes TEXT,
  reminder_minutes_before INTEGER,
  reminder_sound INTEGER NOT NULL DEFAULT 1,
  recurrence TEXT NOT NULL DEFAULT 'none'
    CHECK (recurrence IN ('none', 'daily', 'weekdays', 'weekly')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (start_time != end_time)
);

INSERT INTO tasks_new (id, title, category, date, start_time, end_time, status, notes, reminder_minutes_before, reminder_sound, recurrence, created_at, updated_at)
SELECT id, title, category, date, start_time, end_time, status, notes, reminder_minutes_before, reminder_sound, 'none', created_at, updated_at
FROM tasks;

DROP TABLE tasks;
ALTER TABLE tasks_new RENAME TO tasks;

CREATE INDEX idx_tasks_date ON tasks(date);
CREATE INDEX idx_tasks_recurrence ON tasks(recurrence);

PRAGMA foreign_keys=ON;
