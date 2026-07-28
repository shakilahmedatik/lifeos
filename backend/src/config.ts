import { resolve } from "node:path";
import dotenv from "dotenv";

export interface AppConfig {
  port: number;
  dbPath: string;
  frontendPort: number;
}

export function loadConfig(): AppConfig {
  dotenv.config({ path: resolve(process.cwd(), "../.env") });

  return {
    port: Number(process.env.BACKEND_PORT || 3000),
    dbPath: process.env.DATABASE_PATH || "./data/lifeos.sqlite",
    frontendPort: Number(process.env.FRONTEND_PORT || 5173),
  };
}
