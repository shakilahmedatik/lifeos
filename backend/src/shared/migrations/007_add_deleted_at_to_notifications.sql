-- Migration 007: Add deleted_at column to notifications table
ALTER TABLE notifications ADD COLUMN deleted_at TEXT;
