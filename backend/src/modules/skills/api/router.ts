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
import type { AuthenticatedRequest } from "../../auth/middleware.js";

import type { LearningLogService } from "../application/learning-log-service.js";
import type { LearningResourceService } from "../application/learning-resource-service.js";
import type { SkillAreaService } from "../application/skill-area-service.js";

const ProgressBatchSchema = z.object({
  resourceIds: z.array(z.string().min(1)).min(1, "resourceIds array cannot be empty"),
});

export function createSkillsRouter(
  skillAreaService: SkillAreaService,
  resourceService: LearningResourceService,
  logService: LearningLogService,
): Router {
  const router = Router();

  // Skill Areas
  router.get("/areas", async (req: AuthenticatedRequest, res) => {
    res.json(await skillAreaService.list(req.user?.id));
  });

  router.post(
    "/areas",
    validateBody(NewSkillAreaInputSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const area = await skillAreaService.create(req.body, req.user?.id);
        res.status(201).json(area);
      } catch (err) {
        res.status(409).json({ error: (err as Error).message });
      }
    },
  );

  router.patch(
    "/areas/:id",
    validateBody(UpdateSkillAreaInputSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = String(req.params.id);
        const area = await skillAreaService.update(id, req.body, req.user?.id);
        if (!area) {
          res.status(404).json({ error: "Skill area not found" });
          return;
        }
        res.json(area);
      } catch (err) {
        res.status(409).json({ error: (err as Error).message });
      }
    },
  );

  router.delete("/areas/:id", async (req: AuthenticatedRequest, res) => {
    if (await skillAreaService.delete(String(req.params.id), req.user?.id)) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Skill area not found" });
    }
  });

  // Learning Resources
  router.get("/resources", async (req: AuthenticatedRequest, res) => {
    res.json(await resourceService.list(req.user?.id));
  });

  router.get("/resources/by-area/:areaId", async (req: AuthenticatedRequest, res) => {
    res.json(await resourceService.getBySkillArea(String(req.params.areaId), req.user?.id));
  });

  router.get("/resources/:id/progress", async (req: AuthenticatedRequest, res) => {
    const progress = await logService.getResourceProgress(String(req.params.id), req.user?.id);
    if (!progress) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }
    res.json(progress);
  });

  router.post(
    "/resources/progress-batch",
    validateBody(ProgressBatchSchema),
    async (req: AuthenticatedRequest, res) => {
      const { resourceIds } = req.body;
      const MAX_BATCH = 100;
      const sliced = resourceIds.slice(0, MAX_BATCH);
      const progressArray: (import("@lifeos/contracts").ResourceWithProgress | undefined)[] = [];
      for (const id of sliced) {
        const p = await logService.getResourceProgress(id, req.user?.id);
        if (p) progressArray.push(p);
      }
      res.json(progressArray);
    },
  );

  router.post(
    "/resources",
    validateBody(NewLearningResourceInputSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const resource = await resourceService.create(req.body, req.user?.id);
        res.status(201).json(resource);
      } catch (err) {
        res.status(400).json({ error: (err as Error).message });
      }
    },
  );

  router.patch(
    "/resources/:id",
    validateBody(UpdateLearningResourceInputSchema),
    async (req: AuthenticatedRequest, res) => {
      const resource = await resourceService.update(String(req.params.id), req.body, req.user?.id);
      if (!resource) {
        res.status(404).json({ error: "Resource not found" });
        return;
      }
      res.json(resource);
    },
  );

  router.delete("/resources/:id", async (req: AuthenticatedRequest, res) => {
    if (await resourceService.delete(String(req.params.id), req.user?.id)) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Resource not found" });
    }
  });

  // Learning Logs — static routes BEFORE parameterized routes
  router.get("/logs/range", async (req: AuthenticatedRequest, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      res.status(400).json({ error: "startDate and endDate required" });
      return;
    }
    res.json(await logService.getByDateRange(startDate as string, endDate as string, req.user?.id));
  });

  router.get("/logs/by-resource/:resourceId", async (req: AuthenticatedRequest, res) => {
    res.json(await logService.getByResourceId(String(req.params.resourceId), req.user?.id));
  });

  router.post(
    "/logs",
    validateBody(NewLearningLogInputSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const log = await logService.log(req.body, req.user?.id);
        res.status(201).json(log);
      } catch (err) {
        res.status(400).json({ error: (err as Error).message });
      }
    },
  );

  router.patch(
    "/logs/:id",
    validateBody(UpdateLearningLogInputSchema),
    async (req: AuthenticatedRequest, res) => {
      const log = await logService.updateLog(String(req.params.id), req.body, req.user?.id);
      if (!log) {
        res.status(404).json({ error: "Log not found" });
        return;
      }
      res.json(log);
    },
  );

  router.delete("/logs/:id", async (req: AuthenticatedRequest, res) => {
    if (await logService.delete(String(req.params.id), req.user?.id)) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Log not found" });
    }
  });

  // Summary
  router.get("/summary/:areaId", async (req: AuthenticatedRequest, res) => {
    const summary = await logService.getSkillAreaSummary(
      String(req.params.areaId),
      undefined,
      undefined,
      req.user?.id,
    );
    if (!summary) {
      res.status(404).json({ error: "Skill area not found" });
      return;
    }
    res.json(summary);
  });

  return router;
}
