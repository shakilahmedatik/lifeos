import { resolve } from "node:path";
import { createBackupRouter } from "./api/router.js";

export function initBackupModule(dbPath: string) {
  return {
    router: createBackupRouter(resolve(dbPath)),
  };
}
