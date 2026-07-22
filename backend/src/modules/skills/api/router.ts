import { Router } from "express";

import type { LearningLogService } from "../application/learning-log-service.js";
import type { LearningResourceService } from "../application/learning-resource-service.js";
import type { SkillAreaService } from "../application/skill-area-service.js";

export function createSkillsRouter(
  skillAreaService: SkillAreaService,
  resourceService: LearningResourceService,
  logService: LearningLogService,
): Router {
  const router = Router();

  router.get("/areas", (_req, res) => {
    res.json(skillAreaService.list());
  });

  router.post("/areas", (req, res) => {
    try {
      const area = skillAreaService.create(req.body);
      res.status(201).json(area);
    } catch (err) {
      res.status(409).json({ error: (err as Error).message });
    }
  });

  router.patch("/areas/:id", (req, res) => {
    const area = skillAreaService.update(req.params.id, req.body);
    if (!area) {
      res.status(404).json({ error: "Skill area not found" });
      return;
    }
    res.json(area);
  });

  router.delete("/areas/:id", (req, res) => {
    if (skillAreaService.delete(req.params.id)) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Skill area not found" });
    }
  });

  router.get("/resources", (_req, res) => {
    res.json(resourceService.list());
  });

  router.get("/resources/by-area/:areaId", (req, res) => {
    res.json(resourceService.getBySkillArea(req.params.areaId));
  });

  router.get("/resources/:id/progress", (req, res) => {
    const progress = logService.getResourceProgress(req.params.id);
    if (!progress) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }
    res.json(progress);
  });

  router.post("/resources", (req, res) => {
    try {
      const resource = resourceService.create(req.body);
      res.status(201).json(resource);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.patch("/resources/:id", (req, res) => {
    const resource = resourceService.update(req.params.id, req.body);
    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }
    res.json(resource);
  });

  router.delete("/resources/:id", (req, res) => {
    if (resourceService.delete(req.params.id)) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Resource not found" });
    }
  });

  router.get("/logs/by-resource/:resourceId", (req, res) => {
    res.json(logService.getByResourceId(req.params.resourceId));
  });

  router.get("/logs/range", (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      res.status(400).json({ error: "startDate and endDate required" });
      return;
    }
    res.json(logService.getByDateRange(startDate as string, endDate as string));
  });

  router.post("/logs", (req, res) => {
    try {
      const log = logService.log(req.body);
      res.status(201).json(log);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.delete("/logs/:id", (req, res) => {
    if (logService.delete(req.params.id)) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Log not found" });
    }
  });

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
