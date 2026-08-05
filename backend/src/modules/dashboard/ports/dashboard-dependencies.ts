import type { HabitLogService } from "../../habits/application/habit-log-service.js";
import type { HabitStatsService } from "../../habits/application/habit-stats-service.js";
import type { HabitDefinition } from "../../habits/domain/types.js";
import type { NewsArticleRepository, RssFeedRepository } from "../../news/ports/repositories.js";
import type { ReminderService } from "../../reminders/application/reminder-service.js";
import type { Task } from "../../routine/domain/types.js";
import type { LearningLogService } from "../../skills/application/learning-log-service.js";
import type { SkillAreaService } from "../../skills/application/skill-area-service.js";
import type { WorkoutRepository } from "../../workouts/ports/workout-repository.js";
import type { WorkoutSessionRepository } from "../../workouts/ports/workout-session-repository.js";

export interface DashboardDependencies {
  taskRepo: {
    getByDate(date: string, userId?: string): Task[];
  };
  habitLogService?: HabitLogService;
  habitStatsService?: HabitStatsService;
  habitRepo?: {
    getAll(includeArchived: boolean, userId?: string): HabitDefinition[];
  };
  reminderService?: ReminderService;
  workoutSessionRepo?: WorkoutSessionRepository;
  workoutRepo?: WorkoutRepository;
  learningLogService?: LearningLogService;
  skillAreaService?: SkillAreaService;
  newsArticleRepo?: NewsArticleRepository;
  rssFeedRepo?: RssFeedRepository;
}
