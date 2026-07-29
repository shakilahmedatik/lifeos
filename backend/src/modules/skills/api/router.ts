import {
  NewLearningLogInputSchema,
  NewLearningResourceInputSchema,
  NewSkillAreaInputSchema,
  UpdateLearningLogInputSchema,
  UpdateLearningResourceInputSchema,
  UpdateSkillAreaInputSchema,
} from "@lifeos/contracts";
import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../../../shared/validate.js";

import type { LearningLogService } from "../application/learning-log-service.js";
import type { LearningResourceService } from "../application/learning-resource-service.js";
import type { SkillAreaService } from "../application/skill-area-service.js";

const BackupImportSchema = z.object({
  areas: z.array(NewSkillAreaInputSchema),
  resources: z.array(NewLearningResourceInputSchema),
  logs: z.array(NewLearningLogInputSchema),
});

export function createSkillsRouter(
  skillAreaService: SkillAreaService,
  resourceService: LearningResourceService,
  logService: LearningLogService,
): Router {
  const router = Router();

  // Skill Areas
  router.get("/areas", (_req, res) => {
    res.json(skillAreaService.list());
  });

  router.post("/areas", validateBody(NewSkillAreaInputSchema), (req, res) => {
    try {
      const area = skillAreaService.create(req.body);
      res.status(201).json(area);
    } catch (err) {
      res.status(409).json({ error: (err as Error).message });
    }
  });

  router.patch("/areas/:id", validateBody(UpdateSkillAreaInputSchema), (req, res) => {
    try {
      const id = String(req.params.id);
      const area = skillAreaService.update(id, req.body);
      if (!area) {
        res.status(404).json({ error: "Skill area not found" });
        return;
      }
      res.json(area);
    } catch (err) {
      res.status(409).json({ error: (err as Error).message });
    }
  });

  router.delete("/areas/:id", (req, res) => {
    if (skillAreaService.delete(String(req.params.id))) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Skill area not found" });
    }
  });

  // Import (bulk restore from backup)
  router.post("/import", (req, res) => {
    try {
      const parsed = BackupImportSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Invalid backup data",
          details: parsed.error.errors,
        });
        return;
      }
      const result = { areasCreated: 0, resourcesCreated: 0, logsCreated: 0 };

      for (const area of parsed.data.areas) {
        try {
          skillAreaService.create(area);
          result.areasCreated++;
        } catch {
          // Skip duplicates
        }
      }

      for (const resource of parsed.data.resources) {
        try {
          resourceService.create(resource);
          result.resourcesCreated++;
        } catch {
          // Skip if parent area missing
        }
      }

      for (const log of parsed.data.logs) {
        try {
          logService.log(log);
          result.logsCreated++;
        } catch {
          // Skip if parent resource deleted
        }
      }

      res.status(200).json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Learning Resources
  router.get("/resources", (_req, res) => {
    res.json(resourceService.list());
  });

  router.get("/resources/by-area/:areaId", (req, res) => {
    res.json(resourceService.getBySkillArea(req.params.areaId));
  });

  router.get("/resources/:id/progress", (req, res) => {
    const progress = logService.getResourceProgress(String(req.params.id));
    if (!progress) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }
    res.json(progress);
  });

  router.post("/resources/progress-batch", (req, res) => {
    const { resourceIds }: { resourceIds: string[] } = req.body;
    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      res.status(400).json({ error: "resourceIds array is required" });
      return;
    }
    const MAX_BATCH = 100;
    const sliced = resourceIds.slice(0, MAX_BATCH);
    const progressArray: (import("@lifeos/contracts").ResourceWithProgress | undefined)[] = [];
    for (const id of sliced) {
      const p = logService.getResourceProgress(id);
      if (p) progressArray.push(p);
    }
    res.json(progressArray);
  });

  router.post("/resources", validateBody(NewLearningResourceInputSchema), (req, res) => {
    try {
      const resource = resourceService.create(req.body);
      res.status(201).json(resource);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.patch("/resources/:id", validateBody(UpdateLearningResourceInputSchema), (req, res) => {
    const resource = resourceService.update(String(req.params.id), req.body);
    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }
    res.json(resource);
  });

  router.delete("/resources/:id", (req, res) => {
    if (resourceService.delete(String(req.params.id))) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Resource not found" });
    }
  });

  // Learning Logs — static routes BEFORE parameterized routes
  router.get("/logs/range", (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      res.status(400).json({ error: "startDate and endDate required" });
      return;
    }
    res.json(logService.getByDateRange(startDate as string, endDate as string));
  });

  router.get("/logs/by-resource/:resourceId", (req, res) => {
    res.json(logService.getByResourceId(req.params.resourceId));
  });

  router.post("/logs", validateBody(NewLearningLogInputSchema), (req, res) => {
    try {
      const log = logService.log(req.body);
      res.status(201).json(log);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.patch("/logs/:id", validateBody(UpdateLearningLogInputSchema), (req, res) => {
    const log = logService.updateLog(String(req.params.id), req.body);
    if (!log) {
      res.status(404).json({ error: "Log not found" });
      return;
    }
    res.json(log);
  });

  router.delete("/logs/:id", (req, res) => {
    if (logService.delete(String(req.params.id))) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Log not found" });
    }
  });

  // Summary
  router.get("/summary/:areaId", (req, res) => {
    const summary = logService.getSkillAreaSummary(req.params.areaId);
    if (!summary) {
      res.status(404).json({ error: "Skill area not found" });
      return;
    }
    res.json(summary);
  });

  return router;
}
