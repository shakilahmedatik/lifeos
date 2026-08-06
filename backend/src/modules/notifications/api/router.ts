import { NewNotificationInputSchema, UpdateNotificationInputSchema } from "@lifeos/contracts";
import { Router } from "express";
import { validateBody } from "../../../shared/validate.js";
import type { AuthenticatedRequest } from "../../auth/middleware.js";

import type { NotificationService } from "../application/notification-service.js";

export function createNotificationsRouter(notificationService: NotificationService): Router {
  const router = Router();

  router.get("/", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    await notificationService.processDueRemindersForUser(userId);
    const notifications = await notificationService.listNotifications(userId);
    res.json(notifications);
  });

  router.get("/unread-count", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const count = await notificationService.getUnreadCount(userId);
    res.json({ count });
  });

  router.get("/:id", async (req, res) => {
    const notification = await notificationService.getNotification(req.params.id);
    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.json(notification);
  });

  router.post("/", validateBody(NewNotificationInputSchema), async (req, res) => {
    try {
      const notification = await notificationService.createNotification(req.body);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  router.patch("/:id", validateBody(UpdateNotificationInputSchema), async (req, res) => {
    const notification = await notificationService.updateNotification(
      req.params.id as string,
      req.body,
    );
    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.json(notification);
  });

  router.delete("/:id", async (req, res) => {
    const deleted = await notificationService.deleteNotification(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.status(204).send();
  });

  router.delete("/task/:taskId", async (req, res) => {
    await notificationService.deleteNotificationsByTaskId(req.params.taskId);
    res.status(204).send();
  });

  return router;
}
