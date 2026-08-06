import { Router } from "express";

import { nowIsoInDhaka } from "../../../shared/timezone.js";
import { getDashboardSummary } from "../application/summary.js";
import type { DashboardDependencies } from "../ports/dashboard-dependencies.js";

export function createDashboardRouter(deps: DashboardDependencies): Router {
  const router = Router();

  router.get("/summary", async (req, res) => {
    const clientDate = req.query.date as string | undefined;
    const nowIso = clientDate ? `${clientDate}T${nowIsoInDhaka().slice(11)}` : nowIsoInDhaka();
    const userId =
      (req as unknown as { user?: { id: string } }).user?.id ||
      (req.query.userId as string) ||
      "default";
    const summary = await getDashboardSummary(deps, nowIso, userId);
    res.json(summary);
  });

  return router;
}
