-- Migration 003: Add deleted_at column to all syncable tables for offline-first soft-deletes

ALTER TABLE tasks ADD COLUMN deleted_at TEXT;
ALTER TABLE habits ADD COLUMN deleted_at TEXT;
ALTER TABLE habit_logs ADD COLUMN deleted_at TEXT;
ALTER TABLE exercises ADD COLUMN deleted_at TEXT;
ALTER TABLE workouts ADD COLUMN deleted_at TEXT;
ALTER TABLE workout_exercises ADD COLUMN deleted_at TEXT;
ALTER TABLE workout_sessions ADD COLUMN deleted_at TEXT;
ALTER TABLE exercise_logs ADD COLUMN deleted_at TEXT;
ALTER TABLE accounts ADD COLUMN deleted_at TEXT;
ALTER TABLE categories ADD COLUMN deleted_at TEXT;
ALTER TABLE transactions ADD COLUMN deleted_at TEXT;
ALTER TABLE skill_areas ADD COLUMN deleted_at TEXT;
ALTER TABLE learning_resources ADD COLUMN deleted_at TEXT;
ALTER TABLE learning_logs ADD COLUMN deleted_at TEXT;
ALTER TABLE reminders ADD COLUMN deleted_at TEXT;
ALTER TABLE settings ADD COLUMN deleted_at TEXT;
