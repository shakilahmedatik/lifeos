import {
  isValidDateString,
  NewTaskInputSchema,
  UpdateStatusSchema,
  UpdateTaskSchema,
} from "@lifeos/contracts";
import { Router } from "express";
import { validateBody } from "../../../shared/validate.js";

import {
  createTask,
  deleteTask,
  getDaySchedule,
  setTaskStatus,
  updateTask,
} from "../application/use-cases.js";
import type { TaskRepository } from "../ports/task-repository.js";

export function createRoutineRouter(repo: TaskRepository): Router {
  const router = Router();

  router.get("/tasks", (req, res) => {
    const date = req.query.date as string | undefined;
    if (!date || !isValidDateString(date)) {
      res.status(400).json({ error: "Missing or invalid ?date=YYYY-MM-DD query param" });
      return;
    }
    try {
      const tasks = getDaySchedule(repo, date);
      res.json(tasks);
    } catch (_err) {
      res.status(500).json({ error: "Failed to retrieve schedule" });
    }
  });

  router.post("/tasks", validateBody(NewTaskInputSchema), (req, res) => {
    try {
      const result = createTask(repo, req.body);
      res.status(201).json(result);
    } catch (err) {
      const msg = (err as Error).message;
      res.status(400).json({ error: msg });
    }
  });

  router.patch("/tasks/:id", validateBody(UpdateTaskSchema), (req, res) => {
    try {
      const result = updateTask(repo, req.params.id as string, req.body);
      res.json(result);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("not found")) {
        res.status(404).json({ error: msg });
      } else {
        res.status(400).json({ error: msg });
      }
    }
  });

  router.patch("/tasks/:id/status", validateBody(UpdateStatusSchema), (req, res) => {
    try {
      const task = setTaskStatus(repo, req.params.id as string, req.body.status);
      res.json(task);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("not found")) {
        res.status(404).json({ error: msg });
      } else {
        res.status(400).json({ error: msg });
      }
    }
  });

  router.delete("/tasks/:id", (req, res) => {
    try {
      deleteTask(repo, req.params.id);
      res.status(204).end();
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("not found")) {
        res.status(404).json({ error: msg });
      } else {
        res.status(500).json({ error: "Failed to delete task" });
      }
    }
  });

  return router;
}
