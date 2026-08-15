-- Migration 006: Add reminder_silent to tasks table
ALTER TABLE tasks ADD COLUMN reminder_silent INTEGER NOT NULL DEFAULT 0;
