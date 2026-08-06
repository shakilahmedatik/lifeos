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
  router.get("/areas", async (_req, res) => {
    res.json(await skillAreaService.list());
  });

  router.post("/areas", validateBody(NewSkillAreaInputSchema), async (req, res) => {
    try {
      const area = await skillAreaService.create(req.body);
      res.status(201).json(area);
    } catch (err) {
      res.status(409).json({ error: (err as Error).message });
    }
  });

  router.patch("/areas/:id", validateBody(UpdateSkillAreaInputSchema), async (req, res) => {
    try {
      const id = String(req.params.id);
      const area = await skillAreaService.update(id, req.body);
      if (!area) {
        res.status(404).json({ error: "Skill area not found" });
        return;
      }
      res.json(area);
    } catch (err) {
      res.status(409).json({ error: (err as Error).message });
    }
  });

  router.delete("/areas/:id", async (req, res) => {
    if (await skillAreaService.delete(String(req.params.id))) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Skill area not found" });
    }
  });

  // Import (bulk restore from backup)
  router.post("/import", validateBody(BackupImportSchema), async (req, res) => {
    try {
      const { areas, resources, logs } = req.body;
      const result = { areasCreated: 0, resourcesCreated: 0, logsCreated: 0 };

      for (const area of areas) {
        try {
          await skillAreaService.create(area);
          result.areasCreated++;
        } catch {
          // Skip duplicates
        }
      }

      for (const resource of resources) {
        try {
          await resourceService.create(resource);
          result.resourcesCreated++;
        } catch {
          // Skip if parent area missing
        }
      }

      for (const log of logs) {
        try {
          await logService.log(log);
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
  router.get("/resources", async (_req, res) => {
    res.json(await resourceService.list());
  });

  router.get("/resources/by-area/:areaId", async (req, res) => {
    res.json(await resourceService.getBySkillArea(req.params.areaId));
  });

  router.get("/resources/:id/progress", async (req, res) => {
    const progress = await logService.getResourceProgress(String(req.params.id));
    if (!progress) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }
    res.json(progress);
  });

  router.post("/resources/progress-batch", async (req, res) => {
    const { resourceIds }: { resourceIds: string[] } = req.body;
    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      res.status(400).json({ error: "resourceIds array is required" });
      return;
    }
    const MAX_BATCH = 100;
    const sliced = resourceIds.slice(0, MAX_BATCH);
    const progressArray: (import("@lifeos/contracts").ResourceWithProgress | undefined)[] = [];
    for (const id of sliced) {
      const p = await logService.getResourceProgress(id);
      if (p) progressArray.push(p);
    }
    res.json(progressArray);
  });

  router.post("/resources", validateBody(NewLearningResourceInputSchema), async (req, res) => {
    try {
      const resource = await resourceService.create(req.body);
      res.status(201).json(resource);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.patch(
    "/resources/:id",
    validateBody(UpdateLearningResourceInputSchema),
    async (req, res) => {
      const resource = await resourceService.update(String(req.params.id), req.body);
      if (!resource) {
        res.status(404).json({ error: "Resource not found" });
        return;
      }
      res.json(resource);
    },
  );

  router.delete("/resources/:id", async (req, res) => {
    if (await resourceService.delete(String(req.params.id))) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Resource not found" });
    }
  });

  // Learning Logs — static routes BEFORE parameterized routes
  router.get("/logs/range", async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      res.status(400).json({ error: "startDate and endDate required" });
      return;
    }
    res.json(await logService.getByDateRange(startDate as string, endDate as string));
  });

  router.get("/logs/by-resource/:resourceId", async (req, res) => {
    res.json(await logService.getByResourceId(req.params.resourceId));
  });

  router.post("/logs", validateBody(NewLearningLogInputSchema), async (req, res) => {
    try {
      const log = await logService.log(req.body);
      res.status(201).json(log);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.patch("/logs/:id", validateBody(UpdateLearningLogInputSchema), async (req, res) => {
    const log = await logService.updateLog(String(req.params.id), req.body);
    if (!log) {
      res.status(404).json({ error: "Log not found" });
      return;
    }
    res.json(log);
  });

  router.delete("/logs/:id", async (req, res) => {
    if (await logService.delete(String(req.params.id))) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Log not found" });
    }
  });

  // Summary
  router.get("/summary/:areaId", async (req, res) => {
    const summary = await logService.getSkillAreaSummary(req.params.areaId);
    if (!summary) {
      res.status(404).json({ error: "Skill area not found" });
      return;
    }
    res.json(summary);
  });

  return router;
}
