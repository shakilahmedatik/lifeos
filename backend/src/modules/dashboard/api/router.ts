import { Router } from "express";

import { nowIsoInDhaka } from "../../../shared/timezone.js";
import { getDashboardSummary } from "../application/summary.js";
import type { DashboardDependencies } from "../ports/dashboard-dependencies.js";

export function createDashboardRouter(deps: DashboardDependencies): Router {
  const router = Router();

  router.get("/summary", (req, res) => {
    const clientDate = req.query.date as string | undefined;
    const nowIso = clientDate ? `${clientDate}T${nowIsoInDhaka().slice(11)}` : nowIsoInDhaka();
    const summary = getDashboardSummary(deps, nowIso);
    res.json(summary);
  });

  return router;
}
