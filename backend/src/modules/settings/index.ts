import type { Client } from "@libsql/client";
import type { Router } from "express";
import { createSettingsRouter } from "./router.js";

export interface SettingsModule {
  router: Router;
}

export function initSettingsModule(client: Client): SettingsModule {
  const router = createSettingsRouter(client);
  return { router };
}
