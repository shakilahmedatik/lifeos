import { Router } from "express";

import { nowIsoInDhaka } from "../../../shared/timezone.js";
import { getDashboardSummary } from "../application/summary.js";
import type { DashboardDependencies } from "../ports/dashboard-dependencies.js";

export function createDashboardRouter(deps: DashboardDependencies): Router {
  const router = Router();

  router.get("/summary", (_req, res) => {
    const summary = getDashboardSummary(deps, nowIsoInDhaka());
    res.json(summary);
  });

  return router;
}
