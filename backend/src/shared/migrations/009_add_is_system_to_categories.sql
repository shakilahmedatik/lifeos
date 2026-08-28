-- Migration 009: Add is_system column to categories and ensure default system categories

ALTER TABLE categories ADD COLUMN is_system INTEGER NOT NULL DEFAULT 0;

-- Ensure Transfer In (income) and Transfer Out (expense) default system categories exist
INSERT OR IGNORE INTO categories (id, name, kind, is_system, archived, created_at, updated_at)
VALUES ('cat-system-transfer-in', 'Transfer In', 'income', 1, 0, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO categories (id, name, kind, is_system, archived, created_at, updated_at)
VALUES ('cat-system-transfer-out', 'Transfer Out', 'expense', 1, 0, datetime('now'), datetime('now'));

-- Update any existing Transfer In / Transfer Out categories to be system categories
UPDATE categories SET is_system = 1 WHERE lower(name) = 'transfer in' OR lower(name) = 'transfer out';
