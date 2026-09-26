import type { Router } from "express";
import type { DrizzleClient } from "../../shared/db.js";
import { createSettingsRouter } from "./router.js";

export interface SettingsModule {
  router: Router;
}

export function initSettingsModule(db: DrizzleClient): SettingsModule {
  const router = createSettingsRouter(db);
  return { router };
}
