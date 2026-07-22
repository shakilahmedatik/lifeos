CREATE TABLE IF NOT EXISTS skill_areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS learning_resources (
  id TEXT PRIMARY KEY,
  skill_area_id TEXT NOT NULL REFERENCES skill_areas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('course', 'book', 'project', 'article')),
  total_units REAL,
  unit TEXT CHECK (unit IN ('chapters', 'videos', 'hours')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS learning_logs (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  minutes_spent INTEGER NOT NULL,
  units_completed REAL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_learning_resources_skill_area ON learning_resources(skill_area_id);
CREATE INDEX IF NOT EXISTS idx_learning_logs_resource_date ON learning_logs(resource_id, date);
