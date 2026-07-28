-- Add reps_per_set column to store JSON array of reps for each set
ALTER TABLE workout_exercises ADD COLUMN reps_per_set TEXT;
