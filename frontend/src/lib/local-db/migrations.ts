export const localMigrations = [
  `
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
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

  CREATE TABLE IF NOT EXISTS routine_categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    icon TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
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
    is_system INTEGER NOT NULL DEFAULT 0,
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

  INSERT OR IGNORE INTO categories (id, name, kind, is_system, archived, created_at, updated_at)
  VALUES ('cat-system-transfer-in', 'Transfer In', 'income', 1, 0, datetime('now'), datetime('now'));

  INSERT OR IGNORE INTO categories (id, name, kind, is_system, archived, created_at, updated_at)
  VALUES ('cat-system-transfer-out', 'Transfer Out', 'expense', 1, 0, datetime('now'), datetime('now'));

  CREATE TABLE IF NOT EXISTS rss_feeds (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    icon_url TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active',
    last_fetched_at TEXT,
    last_fetch_error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    _sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS news_articles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    feed_id TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    summary TEXT,
    published_at TEXT,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_read INTEGER NOT NULL DEFAULT 0,
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

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT '',
    reminder_time TEXT NOT NULL,
    sound_type TEXT NOT NULL DEFAULT 'default',
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled')),
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

  -- Performance Indexes
  CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
  CREATE INDEX IF NOT EXISTS idx_tasks_sync_status ON tasks(_sync_status);
  CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);

  CREATE INDEX IF NOT EXISTS idx_routine_categories_user_id ON routine_categories(user_id);
  CREATE INDEX IF NOT EXISTS idx_routine_categories_sort_order ON routine_categories(sort_order);
  CREATE INDEX IF NOT EXISTS idx_routine_categories_sync_status ON routine_categories(_sync_status);
  CREATE INDEX IF NOT EXISTS idx_routine_categories_deleted_at ON routine_categories(deleted_at);

  CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
  CREATE INDEX IF NOT EXISTS idx_habits_sync_status ON habits(_sync_status);

  CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, date);
  CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON habit_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_habit_logs_sync_status ON habit_logs(_sync_status);

  CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
  CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);
  CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_exercise_logs_session_id ON exercise_logs(session_id);

  CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_transactions_sync_status ON transactions(_sync_status);

  CREATE INDEX IF NOT EXISTS idx_skill_areas_user_id ON skill_areas(user_id);
  CREATE INDEX IF NOT EXISTS idx_learning_resources_skill_area_id ON learning_resources(skill_area_id);
  CREATE INDEX IF NOT EXISTS idx_learning_logs_resource_id ON learning_logs(resource_id);
  CREATE INDEX IF NOT EXISTS idx_learning_logs_user_id ON learning_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_learning_logs_date ON learning_logs(date);
  CREATE INDEX IF NOT EXISTS idx_learning_logs_sync_status ON learning_logs(_sync_status);

  CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
  CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(date);
  CREATE INDEX IF NOT EXISTS idx_reminders_sync_status ON reminders(_sync_status);

  CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
  CREATE INDEX IF NOT EXISTS idx_notifications_reminder_time ON notifications(reminder_time);
  CREATE INDEX IF NOT EXISTS idx_notifications_task_id ON notifications(task_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_sync_status ON notifications(_sync_status);

  CREATE INDEX IF NOT EXISTS idx_rss_feeds_user_id ON rss_feeds(user_id);
  CREATE INDEX IF NOT EXISTS idx_rss_feeds_sync_status ON rss_feeds(_sync_status);
  CREATE INDEX IF NOT EXISTS idx_news_articles_user_id ON news_articles(user_id);
  CREATE INDEX IF NOT EXISTS idx_news_articles_feed_id ON news_articles(feed_id);
  CREATE INDEX IF NOT EXISTS idx_news_articles_sync_status ON news_articles(_sync_status);
  `,
];
