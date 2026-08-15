export const localMigrations = [
  `
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('routine', 'must_do', 'work', 'workout', 'learning', 'habit', 'personal', 'general', 'flex')),
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('todo', 'planned', 'in_progress', 'done', 'missed', 'cancelled', 'skipped')),
    notes TEXT,
    reminder_minutes_before INTEGER,
    reminder_silent INTEGER NOT NULL DEFAULT 0,
    reminder_sound INTEGER NOT NULL DEFAULT 1,
    recurrence TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekdays', 'weekly')),
    subtasks TEXT DEFAULT '[]',
    reference_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    frequency TEXT DEFAULT 'daily',
    target_days_per_week INTEGER,
    type TEXT NOT NULL DEFAULT 'boolean' CHECK (type IN ('water', 'walking', 'prayer', 'timed', 'boolean')),
    category TEXT NOT NULL DEFAULT 'general',
    config TEXT NOT NULL DEFAULT '{"type":"boolean"}',
    icon TEXT,
    color TEXT,
    archived INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS habit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    habit_id TEXT NOT NULL,
    date TEXT NOT NULL,
    value REAL NOT NULL DEFAULT 1,
    meta TEXT,
    logged_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    equipment TEXT NOT NULL,
    video_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    description TEXT,
    scheduled_day TEXT,
    scheduled_time TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS workout_exercises (
    id TEXT PRIMARY KEY,
    workout_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    sets INTEGER NOT NULL DEFAULT 3,
    reps INTEGER NOT NULL DEFAULT 10,
    weight REAL,
    rest_seconds INTEGER NOT NULL DEFAULT 60,
    order_index INTEGER NOT NULL DEFAULT 0,
    weight_per_set TEXT,
    reps_per_set TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS workout_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    workout_id TEXT NOT NULL,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    duration_seconds INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS exercise_logs (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    actual_reps INTEGER NOT NULL,
    actual_weight REAL,
    completed_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    account_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    date TEXT NOT NULL,
    amount_minor INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'BDT',
    note TEXT,
    transfer_pair_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS skill_areas (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    color TEXT,
    icon TEXT,
    target_hours REAL NOT NULL DEFAULT 100,
    weekly_goal_hours REAL NOT NULL DEFAULT 5,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS learning_resources (
    id TEXT PRIMARY KEY,
    skill_area_id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    total_units REAL,
    unit TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS learning_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    resource_id TEXT NOT NULL,
    date TEXT NOT NULL,
    minutes_spent INTEGER NOT NULL DEFAULT 0,
    units_completed REAL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    time TEXT NOT NULL,
    date TEXT,
    kind TEXT NOT NULL DEFAULT 'reminder',
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS _sync_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_sync_at TEXT,
    user_id TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1
  );
  INSERT OR IGNORE INTO _sync_meta (id, last_sync_at, user_id) VALUES (1, NULL, NULL);
  `,
];
