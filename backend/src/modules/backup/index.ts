import { resolve } from "node:path";
import type { Client } from "@libsql/client";
import { createBackupRouter } from "./api/router.js";

export function initBackupModule(dbPath: string, client?: Client) {
  return {
    router: createBackupRouter(resolve(dbPath), client),
  };
}
