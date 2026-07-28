-- Add weight_per_set column to store JSON array of weights for each set
ALTER TABLE workout_exercises ADD COLUMN weight_per_set TEXT;
