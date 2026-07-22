CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'default',
  reminder_time TEXT NOT NULL,
  sound_type TEXT NOT NULL DEFAULT 'default'
    CHECK (sound_type IN ('default', 'gentle', 'urgent', 'chime', 'bell')),
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'sent', 'cancelled', 'expired')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_task_id ON notifications(task_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_reminder_time ON notifications(reminder_time);
CREATE INDEX idx_notifications_status ON notifications(status);
