import { z } from "zod";
import { isValidDateString } from "./date-utils.js";

export const TaskCategorySchema = z.string().min(1, "Category is required");

export const RoutineCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be hex color")
    .or(z.string().min(1)),
  icon: z.string().max(50).optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const NewRoutineCategoryInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be hex color")
    .optional(),
  icon: z.string().max(50).optional(),
  sortOrder: z.number().int().optional(),
});

export const UpdateRoutineCategoryInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long").optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be hex color")
    .optional(),
  icon: z.string().max(50).optional(),
  sortOrder: z.number().int().optional(),
});

export const TaskStatusSchema = z.enum([
  "todo",
  "planned",
  "in_progress",
  "done",
  "missed",
  "cancelled",
  "skipped",
]);

export const TaskRecurrenceSchema = z.enum(["none", "daily", "weekdays", "weekly"]);

const StrictDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .refine(isValidDateString, "Must be a valid calendar date");

const StrictTimeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM (24h)");

export const TaskSubtaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  completed: z.boolean(),
});

export const NotificationSoundTypeSchema = z.enum(["default", "gentle", "urgent", "chime", "bell"]);

export const NewTaskInputSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200, "Title is too long"),
    category: TaskCategorySchema.optional(),
    date: StrictDateSchema,
    startTime: StrictTimeSchema,
    endTime: StrictTimeSchema,
    notes: z.string().optional(),
    reminderMinutesBefore: z.number().min(1).max(1440).nullable().optional(),
    reminderSilent: z.boolean().optional(),
    reminderSound: NotificationSoundTypeSchema.optional(),
    recurrence: TaskRecurrenceSchema.optional(),
    subtasks: z.array(TaskSubtaskSchema).optional(),
    referenceId: z.string().optional(),
  })
  .refine((data) => data.startTime !== data.endTime, {
    message: "startTime cannot be equal to endTime",
    path: ["endTime"],
  });

export const UpdateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long").optional(),
  category: TaskCategorySchema.optional(),
  date: StrictDateSchema.optional(),
  startTime: StrictTimeSchema.optional(),
  endTime: StrictTimeSchema.optional(),
  notes: z.string().optional(),
  reminderMinutesBefore: z.number().min(1).max(1440).nullable().optional(),
  reminderSilent: z.boolean().optional(),
  reminderSound: NotificationSoundTypeSchema.optional(),
  recurrence: TaskRecurrenceSchema.optional(),
  subtasks: z.array(TaskSubtaskSchema).optional(),
  isOvernight: z.boolean().optional(),
  referenceId: z.string().optional(),
});

export const UpdateStatusSchema = z.object({
  status: TaskStatusSchema,
});

export const TaskHistoryQuerySchema = z.object({
  startDate: StrictDateSchema.optional(),
  endDate: StrictDateSchema.optional(),
  category: z.union([TaskCategorySchema, z.literal("all")]).optional(),
  status: z.union([TaskStatusSchema, z.literal("all")]).optional(),
  search: z.string().optional(),
});

export const HabitCategorySchema = z.enum([
  "health",
  "learning",
  "productivity",
  "mindfulness",
  "fitness",
  "general",
]);

export const HabitTypeSchema = z.enum(["water", "walking", "prayer", "timed", "boolean"]);

// Type-specific config schemas
export const WaterConfigSchema = z.object({
  type: z.literal("water"),
  dailyGoalMl: z.number().int().positive().max(10000),
  sessionPresetsMl: z.array(z.number().int().positive().max(5000)).min(1).max(10),
  reminderIntervalMin: z.number().int().positive().max(480).optional(),
});

export const WalkingConfigSchema = z.object({
  type: z.literal("walking"),
  dailyGoal: z.number().positive().max(100000),
  unit: z.enum(["steps", "km"]),
});

export const PrayerConfigSchema = z.object({
  type: z.literal("prayer"),
  prayers: z
    .array(
      z.object({
        name: z.string().min(1).max(50),
        time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
      }),
    )
    .min(1)
    .max(10),
});

export const TimedConfigSchema = z.object({
  type: z.literal("timed"),
  dailyGoalMinutes: z.number().int().positive().max(1440),
});

export const BooleanConfigSchema = z.object({
  type: z.literal("boolean"),
});

export const HabitConfigSchema = z.discriminatedUnion("type", [
  WaterConfigSchema,
  WalkingConfigSchema,
  PrayerConfigSchema,
  TimedConfigSchema,
  BooleanConfigSchema,
]);

export const NewHabitDefinitionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  type: HabitTypeSchema,
  category: HabitCategorySchema.optional()
    .nullable()
    .transform((v) => v || undefined),
  icon: z
    .string()
    .max(10)
    .optional()
    .nullable()
    .transform((v) => v || undefined),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be hex color")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  config: HabitConfigSchema,
});

export const UpdateHabitDefinitionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long").optional(),
  type: HabitTypeSchema.optional(),
  category: HabitCategorySchema.optional()
    .nullable()
    .transform((v) => v || undefined),
  icon: z
    .string()
    .max(10)
    .optional()
    .nullable()
    .transform((v) => v || undefined),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be hex color")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  config: HabitConfigSchema.optional(),
  archived: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const NewHabitLogEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  value: z.number().min(0),
  meta: z.string().max(500).optional(),
});

export const BatchLogHabitsSchema = z.object({
  habitIds: z.array(z.string().min(1)),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

export const HabitReorderSchema = z.object({
  orders: z.array(
    z.object({
      id: z.string().min(1),
      sortOrder: z.number().int().min(0),
    }),
  ),
});

// Keep backward compat aliases
/** @deprecated Use NewHabitDefinitionSchema */
export const NewHabitInputSchema = NewHabitDefinitionSchema;
/** @deprecated Use UpdateHabitDefinitionSchema */
export const UpdateHabitSchema = UpdateHabitDefinitionSchema;

export const AccountTypeSchema = z.enum(["cash", "bank", "card", "savings", "mfs"]);

export const NewAccountInputSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: AccountTypeSchema,
});

export const CategoryKindSchema = z.enum(["income", "expense"]);

export const NewCategoryInputSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  kind: CategoryKindSchema,
});

export const NewTransactionInputSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().min(1, "Category is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  amountMinor: z
    .number()
    .int("Amount must be in minor units (integer)")
    .positive("Amount must be positive"),
  currency: z.string().optional(),
  note: z.string().optional(),
  transferPairId: z.string().optional(),
});

export const TransferInputSchema = z.object({
  fromAccountId: z.string().min(1, "Source account is required"),
  toAccountId: z.string().min(1, "Destination account is required"),
  amountMinor: z
    .number()
    .int("Amount must be in minor units (integer)")
    .positive("Amount must be positive"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  note: z.string().max(500).optional(),
});

export const UpdateAccountSchema = z.object({
  name: z.string().min(1, "Account name is required").optional(),
  type: AccountTypeSchema.optional(),
  archived: z.boolean().optional(),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").optional(),
  kind: CategoryKindSchema.optional(),
  archived: z.boolean().optional(),
});

export const UpdateTransactionSchema = z.object({
  accountId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  amountMinor: z
    .number()
    .int("Amount must be in minor units (integer)")
    .positive("Amount must be positive")
    .optional(),
  currency: z.string().optional(),
  note: z.string().optional(),
});

export const NewRssFeedInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Must be a valid RSS URL"),
});

export const NewNotificationInputSchema = z.object({
  taskId: z.string().min(1),
  userId: z.string().optional(),
  reminderTime: z.string(),
  soundType: z.enum(["default", "gentle", "urgent", "chime", "bell"]).optional(),
});

export const UpdateNotificationInputSchema = z.object({
  reminderTime: z.string().optional(),
  soundType: z.enum(["default", "gentle", "urgent", "chime", "bell"]).optional(),
  status: z.enum(["scheduled", "sent", "cancelled", "expired"]).optional(),
});

// Workout schemas
export const MuscleGroupSchema = z.enum([
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "legs",
  "core",
  "cardio",
  "general",
]);

export const EquipmentTypeSchema = z.enum([
  "bodyweight",
  "dumbbell",
  "barbell",
  "machine",
  "cable",
  "other",
]);

export const DayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const NewExerciseInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  muscleGroup: MuscleGroupSchema.optional(),
  equipment: EquipmentTypeSchema.optional(),
  videoUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

export const UpdateExerciseSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  muscleGroup: MuscleGroupSchema.optional(),
  equipment: EquipmentTypeSchema.optional(),
  videoUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

export const NewWorkoutInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500).optional(),
  scheduledDay: DayOfWeekSchema.optional(),
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM")
    .optional(),
});

export const UpdateWorkoutSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  scheduledDay: DayOfWeekSchema.optional(),
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM")
    .optional(),
});

export const NewWorkoutExerciseInputSchema = z.object({
  exerciseId: z.string().min(1).optional(),
  sets: z.number().int().min(1).max(20).optional(),
  reps: z.number().int().min(1).max(100).optional(),
  repsArray: z.array(z.number().int().min(1).max(100)).optional(),
  weight: z.number().min(0).max(1000).optional(),
  weights: z.array(z.number().min(0).max(1000)).optional(),
  restSeconds: z.number().int().min(0).max(600).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export const NewExerciseLogInputSchema = z.object({
  exerciseId: z.string().min(1, "Exercise ID is required"),
  setNumber: z.number().int().min(1).max(20),
  actualReps: z.number().int().min(1).max(100),
  actualWeight: z.number().min(0).max(1000).optional(),
});

export const StartSessionInputSchema = z.object({
  workoutId: z.string().min(1, "Workout ID is required"),
});

export const CompleteSessionInputSchema = z.object({
  durationSeconds: z.number().int().min(0),
  notes: z.string().max(1000).optional(),
});

// Skills schemas
export const NewSkillAreaInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  weeklyGoalHours: z.number().positive().optional(),
});

export const UpdateSkillAreaInputSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  weeklyGoalHours: z.number().positive().optional(),
});

export const NewReminderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  date: z.preprocess(
    (val) => (val === "" ? null : val),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .nullable()
      .optional(),
  ),
  kind: z.enum(["reminder", "event"]).optional(),
});

export const UpdateReminderSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
    .optional(),
  date: z.preprocess(
    (val) => (val === "" ? null : val),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .nullable()
      .optional(),
  ),
  kind: z.enum(["reminder", "event"]).optional(),
  completed: z.boolean().optional(),
});

export const LearningResourceTypeSchema = z.enum(["course", "book", "project", "article"]);
export const LearningUnitSchema = z.enum(["chapters", "videos", "hours"]);

export const NewLearningResourceInputSchema = z.object({
  skillAreaId: z.string().min(1, "Skill area ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  type: LearningResourceTypeSchema,
  totalUnits: z.number().positive().optional(),
  unit: LearningUnitSchema.optional(),
});

export const UpdateLearningResourceInputSchema = z.object({
  skillAreaId: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  type: LearningResourceTypeSchema.optional(),
  totalUnits: z.number().positive().nullable().optional(),
  unit: LearningUnitSchema.nullable().optional(),
});

export const NewLearningLogInputSchema = z.object({
  resourceId: z.string().min(1, "Resource ID is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  minutesSpent: z.number().int().positive("Minutes spent must be positive"),
  unitsCompleted: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

export const UpdateLearningLogInputSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  minutesSpent: z.number().int().positive().optional(),
  unitsCompleted: z.number().min(0).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});
