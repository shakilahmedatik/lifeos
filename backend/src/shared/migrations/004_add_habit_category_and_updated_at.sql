-- Migration 004: Ensure habits table has category and updated_at columns
ALTER TABLE habits ADD COLUMN category TEXT DEFAULT 'general';
ALTER TABLE habits ADD COLUMN updated_at TEXT;
