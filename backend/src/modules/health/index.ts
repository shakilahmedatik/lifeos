import type { Client } from "@libsql/client";
import { createHealthRouter, type SchedulerStatus } from "./api/router.js";

export function initHealthModule(client: Client, getSchedulerStatus?: () => SchedulerStatus[]) {
  return {
    router: createHealthRouter(client, getSchedulerStatus),
  };
}
