import {
  isValidDateString,
  NewTaskInputSchema,
  UpdateStatusSchema,
  UpdateTaskSchema,
} from "@lifeos/contracts";
import { Router } from "express";
import { validateBody } from "../../../shared/validate.js";
import type { AuthenticatedRequest } from "../../auth/middleware.js";

import {
  createTask,
  deleteTask,
  getDaySchedule,
  getRoutineStats,
  getTaskHistory,
  setTaskStatus,
  updateTask,
} from "../application/use-cases.js";
import type { TaskRepository } from "../ports/task-repository.js";

export function createRoutineRouter(repo: TaskRepository): Router {
  const router = Router();

  router.get("/tasks", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    const date = req.query.date as string | undefined;
    if (!date || !isValidDateString(date)) {
      res.status(400).json({ error: "Missing or invalid ?date=YYYY-MM-DD query param" });
      return;
    }
    try {
      const tasks = await getDaySchedule(repo, date, userId);
      res.json(tasks);
    } catch (_err) {
      res.status(500).json({ error: "Failed to retrieve schedule" });
    }
  });

  router.get("/tasks/history", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    try {
      const tasks = await getTaskHistory(
        repo,
        {
          startDate: req.query.startDate as string | undefined,
          endDate: req.query.endDate as string | undefined,
          category: req.query.category as import("@lifeos/contracts").TaskCategory | undefined,
          status: req.query.status as import("@lifeos/contracts").TaskStatus | undefined,
          search: req.query.search as string | undefined,
        },
        userId,
      );
      res.json(tasks);
    } catch (_err) {
      res.status(500).json({ error: "Failed to retrieve task history" });
    }
  });

  router.get("/stats", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    try {
      const stats = await getRoutineStats(repo, userId);
      res.json(stats);
    } catch (_err) {
      res.status(500).json({ error: "Failed to calculate routine stats" });
    }
  });

  router.post(
    "/tasks",
    validateBody(NewTaskInputSchema),
    async (req: AuthenticatedRequest, res) => {
      const userId = req.user?.id || (req.query.userId as string) || "default";
      try {
        const result = await createTask(repo, req.body, userId);
        res.status(201).json(result);
      } catch (err) {
        const msg = (err as Error).message;
        res.status(400).json({ error: msg });
      }
    },
  );

  router.patch(
    "/tasks/:id",
    validateBody(UpdateTaskSchema),
    async (req: AuthenticatedRequest, res) => {
      const userId = req.user?.id || (req.query.userId as string) || "default";
      try {
        const result = await updateTask(repo, req.params.id as string, req.body, userId);
        res.json(result);
      } catch (err) {
        const msg = (err as Error).message;
        if (msg.includes("not found")) {
          res.status(404).json({ error: msg });
        } else {
          res.status(400).json({ error: msg });
        }
      }
    },
  );

  router.patch(
    "/tasks/:id/status",
    validateBody(UpdateStatusSchema),
    async (req: AuthenticatedRequest, res) => {
      const userId = req.user?.id || (req.query.userId as string) || "default";
      try {
        const result = await setTaskStatus(repo, req.params.id as string, req.body.status, userId);
        res.json(result);
      } catch (err) {
        const msg = (err as Error).message;
        if (msg.includes("not found")) {
          res.status(404).json({ error: msg });
        } else {
          res.status(400).json({ error: msg });
        }
      }
    },
  );

  router.delete("/tasks/:id", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || (req.query.userId as string) || "default";
    try {
      await deleteTask(repo, req.params.id as string, userId);
      res.status(204).send();
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("not found")) {
        res.status(404).json({ error: msg });
      } else {
        res.status(400).json({ error: msg });
      }
    }
  });

  return router;
}
