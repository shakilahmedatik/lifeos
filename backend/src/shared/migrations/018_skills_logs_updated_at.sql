ALTER TABLE learning_logs ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));
