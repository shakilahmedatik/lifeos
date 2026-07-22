CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  muscle_group TEXT NOT NULL DEFAULT 'general' CHECK (muscle_group IN ('chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core', 'cardio', 'general')),
  video_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  scheduled_day TEXT CHECK (scheduled_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  scheduled_time TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
  UNIQUE(workout_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  duration_seconds INTEGER,
  notes TEXT,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exercise_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  actual_reps INTEGER NOT NULL,
  actual_weight REAL,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- Indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_workouts_scheduled_day ON workouts(scheduled_day);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout_id ON workout_sessions(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_started_at ON workout_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_session_id ON exercise_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise_id ON exercise_logs(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);

-- Seed data for exercise library
INSERT OR IGNORE INTO exercises (id, name, muscle_group, video_url) VALUES
  ('ex-001', 'Bench Press', 'chest', 'https://www.youtube.com/watch?v=vcBig73ojpE'),
  ('ex-002', 'Incline Dumbbell Press', 'chest', 'https://www.youtube.com/watch8iXAbz7YdY'),
  ('ex-003', 'Push-ups', 'chest', 'https://www.youtube.com/watch?v=IODxDxX7oi4'),
  ('ex-004', 'Pull-ups', 'back', 'https://www.youtube.com/watch?v=eGo4IYlbE5g'),
  ('ex-005', 'Barbell Rows', 'back', 'https://www.youtube.com/watch?v=kBWAon7ItDw'),
  ('ex-006', 'Lat Pulldown', 'back', 'https://www.youtube.com/watch8CAIFlZzDk'),
  ('ex-007', 'Overhead Press', 'shoulders', 'https://www.youtube.com/watch?v=_RlRDWO2j_g'),
  ('ex-008', 'Lateral Raises', 'shoulders', 'https://www.youtube.com/watch?v=3VcKaXpzqRo'),
  ('ex-009', 'Bicep Curls', 'biceps', 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo'),
  ('ex-010', 'Tricep Dips', 'triceps', 'https://www.youtube.com/watch8kLk2YnYfQ'),
  ('ex-011', 'Squats', 'legs', 'https://www.youtube.com/watch?v=ultWZbUMPL8'),
  ('ex-012', 'Deadlifts', 'legs', 'https://www.youtube.com/watch?v=op9kVnSo6Wc'),
  ('ex-013', 'Lunges', 'legs', 'https://www.youtube.com/watch?v=QOVaHwm-Q6U'),
  ('ex-014', 'Plank', 'core', 'https://www.youtube.com/watch?v=ASdvN_XEl_c'),
  ('ex-015', 'Russian Twists', 'core', 'https://www.youtube.com/watch8wkD8rD0'),
  ('ex-016', 'Running', 'cardio', 'https://www.youtube.com/watch?v=brFHyOtTwH4'),
  ('ex-017', 'Jumping Jacks', 'cardio', 'https://www.youtube.com/watch?v=c4DAnQ6DtF8'),
  ('ex-018', 'Shoulder Shrugs', 'general', 'https://www.youtube.com/watch8HbKfDf0'),
  ('ex-019', 'Calf Raises', 'general', 'https://www.youtube.com/watch8JkLm9N0'),
  ('ex-020', 'Mountain Climbers', 'general', 'https://www.youtube.com/watch8NmwZpK0');