import {
  isValidDateString,
  NewTaskInputSchema,
  UpdateStatusSchema,
  UpdateTaskSchema,
} from "@lifeos/contracts";
import { Router } from "express";

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

  router.post("/tasks", (req, res) => {
    const parsed = NewTaskInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const result = createTask(repo, parsed.data);
      res.status(201).json(result);
    } catch (err) {
      const msg = (err as Error).message;
      res.status(400).json({ error: msg });
    }
  });

  router.patch("/tasks/:id", (req, res) => {
    const parsed = UpdateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const result = updateTask(repo, req.params.id, parsed.data);
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

  router.patch("/tasks/:id/status", (req, res) => {
    const parsed = UpdateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const task = setTaskStatus(repo, req.params.id, parsed.data.status);
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
