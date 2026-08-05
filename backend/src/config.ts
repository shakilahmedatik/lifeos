import { resolve } from "node:path";
import dotenv from "dotenv";

export interface AppConfig {
  port: number;
  dbPath: string;
  frontendPort: number;
  databaseUrl?: string;
  tursoDatabaseToken?: string;
  betterAuthSecret?: string;
  allowedOrigins: string[];
}

export function loadConfig(): AppConfig {
  dotenv.config({ path: resolve(process.cwd(), "../.env") });
  dotenv.config(); // fallback to current dir .env

  const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || process.env.CLIENT_ORIGIN;
  const allowedOrigins = rawAllowedOrigins
    ? rawAllowedOrigins.split(",").map((o) => o.trim())
    : [`http://localhost:${process.env.FRONTEND_PORT || 5173}`];

  return {
    port: Number(process.env.BACKEND_PORT || 3000),
    dbPath: process.env.DATABASE_PATH || "./data/lifeos.sqlite",
    frontendPort: Number(process.env.FRONTEND_PORT || 5173),
    databaseUrl: process.env.DATABASE_URL,
    tursoDatabaseToken: process.env.TURSO_DATABASE_TOKEN,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    allowedOrigins,
  };
}
