CREATE TABLE IF NOT EXISTS workout_exercises_new (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER NOT NULL DEFAULT 10,
  weight REAL,
  rest_seconds INTEGER NOT NULL DEFAULT 60,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  weight_per_set TEXT,
  reps_per_set TEXT,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

INSERT INTO workout_exercises_new (
  id, workout_id, exercise_id, sets, reps, weight, rest_seconds, order_index, created_at, weight_per_set, reps_per_set
)
SELECT 
  id, workout_id, exercise_id, sets, reps, weight, rest_seconds, order_index, created_at, weight_per_set, reps_per_set
FROM workout_exercises;

DROP TABLE workout_exercises;
ALTER TABLE workout_exercises_new RENAME TO workout_exercises;

CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);
