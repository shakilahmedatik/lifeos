import type { DrizzleClient } from "../../shared/db.js";
import { createHealthRouter, type SchedulerStatus } from "./api/router.js";

export function initHealthModule(db: DrizzleClient, getSchedulerStatus?: () => SchedulerStatus[]) {
  return {
    router: createHealthRouter(db, getSchedulerStatus),
  };
}
