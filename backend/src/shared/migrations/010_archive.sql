-- Add archived status column to data tables for bulk archiving

ALTER TABLE tasks ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
ALTER TABLE transactions ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
ALTER TABLE habit_logs ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
