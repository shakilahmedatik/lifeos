import { NewNotificationInputSchema, UpdateNotificationInputSchema } from "@lifeos/contracts";
import { Router } from "express";
import { validateBody } from "../../../shared/validate.js";
import type { AuthenticatedRequest } from "../../auth/middleware.js";

import type { NotificationService } from "../application/notification-service.js";

export function createNotificationsRouter(notificationService: NotificationService): Router {
  const router = Router();

  router.get("/", (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    notificationService.processDueRemindersForUser(userId);
    const notifications = notificationService.listNotifications(userId);
    res.json(notifications);
  });

  router.get("/unread-count", (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const count = notificationService.getUnreadCount(userId);
    res.json({ count });
  });

  router.get("/:id", (req, res) => {
    const notification = notificationService.getNotification(req.params.id);
    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.json(notification);
  });

  router.post("/", validateBody(NewNotificationInputSchema), (req, res) => {
    try {
      const notification = notificationService.createNotification(req.body);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  router.patch("/:id", validateBody(UpdateNotificationInputSchema), (req, res) => {
    const notification = notificationService.updateNotification(req.params.id as string, req.body);
    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.json(notification);
  });

  router.delete("/:id", (req, res) => {
    const deleted = notificationService.deleteNotification(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.status(204).send();
  });

  router.delete("/task/:taskId", (req, res) => {
    notificationService.deleteNotificationsByTaskId(req.params.taskId);
    res.status(204).send();
  });

  return router;
}
