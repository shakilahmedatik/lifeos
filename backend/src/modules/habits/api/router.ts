import { NewHabitInputSchema } from "@lifeos/contracts";
import { Router } from "express";
import { z } from "zod";
import { nowIsoInDhaka, todayInDhaka } from "../../../shared/timezone.js";
import { validateBody } from "../../../shared/validate.js";
import type { HabitLogService } from "../application/habit-log-service.js";
import type { HabitService } from "../application/habit-service.js";
import type { HabitStatsService } from "../application/habit-stats-service.js";
import type { WeeklyReviewService } from "../application/weekly-review-service.js";

const HabitLogBodySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
});

export function createHabitsRouter(
  habitService: HabitService,
  habitLogService: HabitLogService,
  habitStatsService: HabitStatsService,
  weeklyReviewService: WeeklyReviewService,
): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    const habits = habitService.listHabits();
    res.json(habits);
  });

  router.get("/today", (_req, res) => {
    const today = todayInDhaka();
    const habits = habitLogService.getTodayDueHabits(today);
    res.json(habits);
  });

  router.get("/weekly-review", (req, res) => {
    const { weekStart } = req.query;
    if (!weekStart) {
      const today = new Date(nowIsoInDhaka());
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today);
      monday.setDate(diff);
      const weekStartStr = monday.toISOString().split("T")[0];
      const summary = weeklyReviewService.getWeeklySummary(weekStartStr);
      res.json(summary);
      return;
    }
    const summary = weeklyReviewService.getWeeklySummary(weekStart as string);
    res.json(summary);
  });

  router.get("/:id", (req, res) => {
    const habit = habitService.getHabit(req.params.id);
    if (!habit) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }
    res.json(habit);
  });

  router.post("/", validateBody(NewHabitInputSchema), (req, res) => {
    try {
      const habit = habitService.createHabit(req.body);
      res.status(201).json(habit);
    } catch (error) {
      if (error instanceof Error && error.message === "Habit with this name already exists") {
        res.status(409).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  });

  router.patch("/:id", (req, res) => {
    const habit = habitService.updateHabit(req.params.id, req.body);
    if (!habit) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }
    res.json(habit);
  });

  router.delete("/:id", (req, res) => {
    habitLogService.deleteLogsByHabitId(req.params.id);
    const deleted = habitService.deleteHabit(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }
    res.status(204).send();
  });

  router.post("/:id/log", validateBody(HabitLogBodySchema), (req, res) => {
    const date = req.body.date || todayInDhaka();
    const log = habitLogService.logHabit({ habitId: req.params.id as string, date });
    res.status(201).json(log);
  });

  router.delete("/:id/log/:date", (req, res) => {
    const deleted = habitLogService.unlogHabit(req.params.id, req.params.date);
    if (!deleted) {
      res.status(404).json({ error: "Log not found" });
      return;
    }
    res.status(204).send();
  });

  router.post("/log-batch", (req, res) => {
    const { habitIds, date } = req.body;
    const logs = habitLogService.batchLogHabits(habitIds, date);
    res.status(201).json(logs);
  });

  router.get("/:id/stats", (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      res.status(400).json({ error: "startDate and endDate are required" });
      return;
    }
    const stats = habitStatsService.getHabitStats(
      req.params.id,
      startDate as string,
      endDate as string,
    );
    if (!stats) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }
    res.json(stats);
  });

  return router;
}
