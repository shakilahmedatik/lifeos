import { Router } from "express";
import { z } from "zod";

import {
  createTask,
  deleteTask,
  getDaySchedule,
  setTaskStatus,
  updateTask,
} from "../application/use-cases.js";
import type { TaskRepository } from "../ports/task-repository.js";

const TaskCategorySchema = z.enum(["work", "workout", "learning", "habit", "personal", "general"]);
const TaskStatusSchema = z.enum(["planned", "in_progress", "done", "skipped"]);

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  category: TaskCategorySchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().optional(),
  reminderMinutesBefore: z.number().int().nonnegative().optional(),
  reminderSound: z.boolean().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  category: TaskCategorySchema.optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  notes: z.string().optional(),
  reminderMinutesBefore: z.number().int().nonnegative().optional(),
  reminderSound: z.boolean().optional(),
});

const UpdateStatusSchema = z.object({
  status: TaskStatusSchema,
});

export function createRoutineRouter(repo: TaskRepository): Router {
  const router = Router();

  router.get("/tasks", (req, res) => {
    const date = req.query.date as string | undefined;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: "Missing or invalid ?date=YYYY-MM-DD query param" });
      return;
    }
    const tasks = getDaySchedule(repo, date);
    res.json(tasks);
  });

  router.post("/tasks", (req, res) => {
    const parsed = CreateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const result = createTask(repo, parsed.data);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.patch("/tasks/:id", (req, res) => {
    const parsed = UpdateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const task = updateTask(repo, req.params.id, parsed.data);
      res.json(task);
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
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
      res.status(404).json({ error: (err as Error).message });
    }
  });

  router.delete("/tasks/:id", (req, res) => {
    try {
      deleteTask(repo, req.params.id);
      res.status(204).end();
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  });

  return router;
}
