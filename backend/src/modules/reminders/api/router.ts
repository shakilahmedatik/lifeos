import { NewReminderSchema, UpdateReminderSchema } from "@lifeos/contracts";
import { Router } from "express";
import { todayInDhaka } from "../../../shared/timezone.js";
import { validateBody } from "../../../shared/validate.js";
import type { ReminderService } from "../application/reminder-service.js";

export function createRemindersRouter(reminderService: ReminderService): Router {
  const router = Router();

  router.get("/", (req, res) => {
    const { date } = req.query;
    if (typeof date === "string") {
      res.json(reminderService.getByDate(date));
    } else {
      res.json(reminderService.getAll());
    }
  });

  router.get("/today", (_req, res) => {
    const today = todayInDhaka();
    res.json(reminderService.getTodayReminders(today));
  });

  router.get("/:id", (req, res) => {
    const reminder = reminderService.getById(req.params.id as string);
    if (!reminder) {
      res.status(404).json({ error: "Reminder not found" });
      return;
    }
    res.json(reminder);
  });

  router.post("/", validateBody(NewReminderSchema), (req, res) => {
    try {
      const reminder = reminderService.create(req.body);
      res.status(201).json(reminder);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.patch("/:id", validateBody(UpdateReminderSchema), (req, res) => {
    try {
      const updated = reminderService.update(req.params.id as string, req.body);
      if (!updated) {
        res.status(404).json({ error: "Reminder not found" });
        return;
      }
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.delete("/:id", (req, res) => {
    const deleted = reminderService.delete(req.params.id as string);
    if (!deleted) {
      res.status(404).json({ error: "Reminder not found" });
      return;
    }
    res.status(204).send();
  });

  return router;
}
