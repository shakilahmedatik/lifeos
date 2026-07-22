export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "legs"
  | "core"
  | "cardio"
  | "general";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewExerciseInput {
  name: string;
  muscleGroup?: MuscleGroup;
  videoUrl?: string;
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  scheduledDay?: DayOfWeek;
  scheduledTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewWorkoutInput {
  name: string;
  description?: string;
  scheduledDay?: DayOfWeek;
  scheduledTime?: string;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  sets: number;
  reps: number;
  weight?: number;
  restSeconds: number;
  orderIndex: number;
  createdAt: string;
}

export interface NewWorkoutExerciseInput {
  exerciseId: string;
  sets?: number;
  reps?: number;
  weight?: number;
  restSeconds?: number;
  orderIndex?: number;
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  notes?: string;
}

export interface ExerciseLog {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  actualReps: number;
  actualWeight?: number;
  completedAt: string;
}

export interface NewExerciseLogInput {
  exerciseId: string;
  setNumber: number;
  actualReps: number;
  actualWeight?: number;
}

export interface WorkoutWithExercises extends Workout {
  exercises: WorkoutExercise[];
}

export interface WorkoutSessionWithLogs extends WorkoutSession {
  logs: ExerciseLog[];
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalSessions: number;
  totalDuration: number;
  averageDuration: number;
  lastWorkoutDate?: string;
}
