import { randomUUID } from "node:crypto";
import { NewNotificationInputSchema, UpdateNotificationInputSchema } from "@lifeos/contracts";
import { Router } from "express";
import { validateBody } from "../../../shared/validate.js";

import type { NotificationBroadcaster } from "../application/notification-broadcaster.js";
import type { NotificationService } from "../application/notification-service.js";

export function createNotificationsRouter(
  notificationService: NotificationService,
  broadcaster: NotificationBroadcaster,
): Router {
  const router = Router();

  router.get("/", (req, res) => {
    const userId = (req.query.userId as string) || "default";
    const notifications = notificationService.listNotifications(userId);
    res.json(notifications);
  });

  router.get("/unread-count", (req, res) => {
    const userId = (req.query.userId as string) || "default";
    const count = notificationService.getUnreadCount(userId);
    res.json({ count });
  });

  router.get("/stream", (_req, res) => {
    const clientId = randomUUID();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.flushHeaders();

    res.write(`: connected ${clientId}\n\n`);

    broadcaster.addClient(clientId, res);
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

  router.post("/task/:taskId", (req, res) => {
    notificationService.deleteNotificationsByTaskId(req.params.taskId);
    res.status(204).send();
  });

  return router;
}
