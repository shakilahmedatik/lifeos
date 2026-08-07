import { NewReminderSchema, UpdateReminderSchema } from "@lifeos/contracts";
import { Router } from "express";
import { todayInDhaka } from "../../../shared/timezone.js";
import { validateBody } from "../../../shared/validate.js";
import type { AuthenticatedRequest } from "../../auth/middleware.js";
import type { ReminderService } from "../application/reminder-service.js";

export function createRemindersRouter(reminderService: ReminderService): Router {
  const router = Router();

  router.get("/", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const { date } = req.query;
    if (typeof date === "string") {
      res.json(await reminderService.getByDate(date, userId));
    } else {
      res.json(await reminderService.getAll(userId));
    }
  });

  router.get("/today", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const today = todayInDhaka();
    res.json(await reminderService.getTodayReminders(today, userId));
  });

  router.get("/:id", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const reminder = await reminderService.getById(req.params.id as string, userId);
    if (!reminder) {
      res.status(404).json({ error: "Reminder not found" });
      return;
    }
    res.json(reminder);
  });

  router.post("/", validateBody(NewReminderSchema), async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    try {
      const reminder = await reminderService.create(req.body, userId);
      res.status(201).json(reminder);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.patch(
    "/:id",
    validateBody(UpdateReminderSchema),
    async (req: AuthenticatedRequest, res) => {
      const userId = req.user?.id || (req.query.userId as string) || "default";
      try {
        const updated = await reminderService.update(req.params.id as string, req.body, userId);
        if (!updated) {
          res.status(404).json({ error: "Reminder not found" });
          return;
        }
        res.json(updated);
      } catch (err) {
        res.status(400).json({ error: (err as Error).message });
      }
    },
  );

  router.delete("/:id", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const deleted = await reminderService.delete(req.params.id as string, userId);
    if (!deleted) {
      res.status(404).json({ error: "Reminder not found" });
      return;
    }
    res.status(204).send();
  });

  return router;
}
