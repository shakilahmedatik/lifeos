import {
  NewNotificationInputSchema,
  NotificationSoundTypeSchema,
  UpdateNotificationInputSchema,
} from "@lifeos/contracts";
import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../../../shared/validate.js";
import type { AuthenticatedRequest } from "../../auth/middleware.js";

import type { NotificationService } from "../application/notification-service.js";

const SoundSettingInputSchema = z.object({
  soundType: NotificationSoundTypeSchema,
});

export function createNotificationsRouter(notificationService: NotificationService): Router {
  const router = Router();

  router.get("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || (req.query.userId as string) || "default";
      await notificationService.processDueRemindersForUser(userId);
      const notifications = await notificationService.listNotifications(userId);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });

  router.get("/due", async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || (req.query.userId as string) || "default";
      const dueNotifications = await notificationService.processDueRemindersForUser(userId);
      res.json(dueNotifications);
    } catch (error) {
      next(error);
    }
  });

  router.get("/unread-count", async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || (req.query.userId as string) || "default";
      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  });

  router.get("/settings/sound", async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || (req.query.userId as string) || "default";
      const soundType = await notificationService.getSoundPreference(userId);
      res.json({ soundType });
    } catch (error) {
      next(error);
    }
  });

  router.put(
    "/settings/sound",
    validateBody(SoundSettingInputSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const userId = req.user?.id || (req.query.userId as string) || "default";
        await notificationService.setSoundPreference(userId, req.body.soundType);
        res.json({ soundType: req.body.soundType });
      } catch (error) {
        next(error);
      }
    },
  );

  router.get("/:id", async (req, res, next) => {
    try {
      const notification = await notificationService.getNotification(req.params.id as string);
      if (!notification) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }
      res.json(notification);
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/",
    validateBody(NewNotificationInputSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const userId = req.user?.id || req.body.userId || "default";
        const input = { ...req.body, userId };
        const notification = await notificationService.createNotification(input);
        res.status(201).json(notification);
      } catch (error) {
        if (error instanceof Error) {
          res.status(400).json({ error: error.message });
          return;
        }
        next(error);
      }
    },
  );

  router.patch("/:id", validateBody(UpdateNotificationInputSchema), async (req, res, next) => {
    try {
      const notification = await notificationService.updateNotification(
        req.params.id as string,
        req.body,
      );
      if (!notification) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }
      res.json(notification);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const deleted = await notificationService.deleteNotification(req.params.id as string);
      if (!deleted) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  router.delete("/task/:taskId", async (req, res, next) => {
    try {
      await notificationService.deleteNotificationsByTaskId(req.params.taskId as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
