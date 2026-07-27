import type Database from "better-sqlite3";
import { createHealthRouter, type SchedulerStatus } from "./api/router.js";

export function initHealthModule(
  db: Database.Database,
  getSchedulerStatus?: () => SchedulerStatus[],
) {
  return {
    router: createHealthRouter(db, getSchedulerStatus),
  };
}
