import { z } from "zod";

export const TaskCategorySchema = z.enum([
  "work",
  "workout",
  "learning",
  "habit",
  "personal",
  "general",
]);

export const TaskStatusSchema = z.enum(["planned", "in_progress", "done", "skipped"]);

export const NewTaskInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  category: TaskCategorySchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be HH:MM"),
  notes: z.string().optional(),
  reminderMinutesBefore: z.number().min(1).max(1440).nullable().optional(),
  reminderSilent: z.boolean().optional(),
});

export const HabitCategorySchema = z.enum([
  "health",
  "learning",
  "productivity",
  "mindfulness",
  "fitness",
  "general",
]);

export const HabitFrequencySchema = z.enum(["daily", "weekly"]);

export const NewHabitInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  frequency: HabitFrequencySchema.optional(),
  targetCount: z.number().int().positive().optional(),
  category: HabitCategorySchema.optional(),
});

export const NewHabitLogInputSchema = z.object({
  habitId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

export const AccountTypeSchema = z.enum(["cash", "bank", "card", "savings"]);

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
  amountMinor: z.number().int("Amount must be in minor units (integer)"),
  currency: z.string().optional(),
  note: z.string().optional(),
  transferPairId: z.string().optional(),
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
