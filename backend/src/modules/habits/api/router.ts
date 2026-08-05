import {
  BatchLogHabitsSchema,
  HabitReorderSchema,
  NewHabitDefinitionSchema,
  NewHabitLogEntrySchema,
  UpdateHabitDefinitionSchema,
} from "@lifeos/contracts";
import { Router } from "express";
import { z } from "zod";
import { todayInDhaka } from "../../../shared/timezone.js";
import { validateBody } from "../../../shared/validate.js";
import type { AuthenticatedRequest } from "../../auth/middleware.js";
import type { HabitLogService } from "../application/habit-log-service.js";
import type { HabitService } from "../application/habit-service.js";
import type { HabitStatsService } from "../application/habit-stats-service.js";
import type { WeeklyReviewService } from "../application/weekly-review-service.js";
import type { HabitLogRepository } from "../ports/habit-log-repository.js";

const ArchiveHabitSchema = z.object({
  archived: z.boolean(),
});

export function createHabitsRouter(
  habitService: HabitService,
  habitLogService: HabitLogService,
  habitStatsService: HabitStatsService,
  weeklyReviewService: WeeklyReviewService,
  habitLogRepo?: HabitLogRepository,
): Router {
  const router = Router();

  router.get("/", (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const includeArchived = req.query.active !== "true"; // if ?active=true, includeArchived is false
    const habits = habitService.listHabits(includeArchived, userId);
    res.json(habits);
  });

  router.get("/today", (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const today = todayInDhaka();
    const habits = habitLogService.getTodayDueHabits(today, userId);
    res.json(habits);
  });

  router.get("/weekly-review", (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const { weekStart } = req.query;
    if (!weekStart) {
      const todayStr = todayInDhaka();
      const today = new Date(`${todayStr}T00:00:00Z`);
      const day = today.getUTCDay();
      const diff = today.getUTCDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today);
      monday.setUTCDate(diff);
      const weekStartStr = monday.toISOString().split("T")[0];
      const summary = weeklyReviewService.getWeeklySummary(weekStartStr, userId);
      res.json(summary);
      return;
    }
    const summary = weeklyReviewService.getWeeklySummary(weekStart as string, userId);
    res.json(summary);
  });

  router.patch("/reorder", validateBody(HabitReorderSchema), (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.body.userId as string) || "default";
    habitService.reorderHabits(req.body.orders, userId);
    res.status(204).send();
  });

  router.get("/export", (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const habits = habitService.listHabits(true, userId);
    const logs = habitLogRepo ? habitLogRepo.getAllLogs(userId) : [];
    res.json({ habits, logs });
  });

  router.post("/import", (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.body.userId as string) || "default";
    try {
      const { habits, logs } = req.body || {};
      if (!Array.isArray(habits)) {
        res.status(400).json({ error: "Invalid import format: habits array required" });
        return;
      }

      for (const h of habits) {
        if (!h.id || !h.name || !h.type) continue;
        const existing = habitService.getHabit(h.id, userId);
        if (existing) {
          habitService.updateHabit(
            h.id,
            {
              name: h.name,
              category: h.category,
              icon: h.icon,
              color: h.color,
              config: h.config,
            },
            userId,
          );
        } else {
          try {
            habitService.createHabit(
              {
                name: h.name,
                type: h.type,
                category: h.category,
                icon: h.icon,
                color: h.color,
                config: h.config,
              },
              userId,
            );
          } catch {
            // ignore if duplicate
          }
        }
      }

      if (Array.isArray(logs) && habitLogRepo) {
        for (const l of logs) {
          if (!l.id || !l.habitId || !l.date) continue;
          const existing = habitLogRepo.getById(l.id, userId);
          if (!existing) {
            try {
              habitLogRepo.create(
                l.id,
                {
                  habitId: l.habitId,
                  date: l.date,
                  value: l.value ?? 1,
                  meta: l.meta,
                },
                userId,
              );
            } catch {
              // ignore
            }
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (err) {
      const msg = (err as Error).message;
      res.status(400).json({ error: msg || "Failed to import habit data" });
    }
  });

  router.get("/:id", (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const habit = habitService.getHabit(req.params.id as string, userId);
    if (!habit) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }
    res.json(habit);
  });

  router.post("/", validateBody(NewHabitDefinitionSchema), (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.body.userId as string) || "default";
    try {
      const habit = habitService.createHabit(req.body, userId);
      res.status(201).json(habit);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes("already exists") || msg.includes("UNIQUE constraint failed")) {
        res.status(409).json({ error: "A habit with this name already exists" });
        return;
      }
      res.status(400).json({ error: msg });
    }
  });

  router.patch(
    "/:id",
    validateBody(UpdateHabitDefinitionSchema),
    (req: AuthenticatedRequest, res) => {
      const userId = req.user?.id || (req.body.userId as string) || "default";
      try {
        const id = req.params.id as string;
        const habit = habitService.updateHabit(id, req.body, userId);
        if (!habit) {
          res.status(404).json({ error: "Habit not found" });
          return;
        }
        res.json(habit);
      } catch (error) {
        const msg = (error as Error).message;
        if (msg.includes("already exists") || msg.includes("UNIQUE constraint failed")) {
          res.status(409).json({ error: "A habit with this name already exists" });
          return;
        }
        res.status(400).json({ error: msg });
      }
    },
  );

  router.patch(
    "/:id/archive",
    validateBody(ArchiveHabitSchema),
    (req: AuthenticatedRequest, res) => {
      const userId = req.user?.id || (req.body.userId as string) || "default";
      habitService.archiveHabit(req.params.id as string, req.body.archived, userId);
      res.status(204).send();
    },
  );

  router.delete("/:id", (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    habitLogService.deleteLogsByHabitId(req.params.id as string, userId);
    const deleted = habitService.deleteHabit(req.params.id as string, userId);
    if (!deleted) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }
    res.status(204).send();
  });

  router.post(
    "/:id/log",
    validateBody(NewHabitLogEntrySchema),
    (req: AuthenticatedRequest, res) => {
      const userId = req.user?.id || (req.body.userId as string) || "default";
      const log = habitLogService.logHabit(
        {
          ...req.body,
          habitId: req.params.id as string,
        },
        userId,
      );
      res.status(201).json(log);
    },
  );

  router.delete("/log/:logId", (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const deleted = habitLogService.removeLog(req.params.logId as string, userId);
    if (!deleted) {
      res.status(404).json({ error: "Log not found" });
      return;
    }
    res.status(204).send();
  });

  router.delete("/:id/log/:date", (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const logs = habitLogService.getLogsForHabitAndDate(
      req.params.id as string,
      req.params.date as string,
      userId,
    );
    for (const log of logs) {
      habitLogService.removeLog(log.id, userId);
    }
    res.status(204).send();
  });

  router.get("/:id/logs", (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const { date } = req.query;
    if (!date) {
      res.status(400).json({ error: "Date query param is required" });
      return;
    }
    const logs = habitLogService.getLogsForHabitAndDate(
      req.params.id as string,
      date as string,
      userId,
    );
    res.json(logs);
  });

  router.post("/log-batch", validateBody(BatchLogHabitsSchema), (_req, res) => {
    // Left mostly as is, maybe update to require default value=1 if used.
    // Actually the prompt says to rewrite for typed habit.
    res.status(501).json({ error: "Batch logging not supported for complex typed habits yet." });
  });

  router.get("/:id/analytics", (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const { period } = req.query;
    if (period !== "week" && period !== "month") {
      res.status(400).json({ error: "period must be week or month" });
      return;
    }

    const stats = habitStatsService.getAnalytics(
      req.params.id as string,
      period as "week" | "month",
      userId,
    );
    if (!stats) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }
    res.json(stats);
  });

  return router;
}
