import { createDashboardRouter } from "./api/router.js";
import type { DashboardDependencies } from "./ports/dashboard-dependencies.js";

export function initDashboardModule(deps: DashboardDependencies) {
  return {
    router: createDashboardRouter(deps),
  };
}
