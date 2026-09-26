import { resolve } from "node:path";
import dotenv from "dotenv";

export interface AppConfig {
  port: number;
  dbPath: string;
  frontendPort: number;
  databaseUrl?: string;
  tursoDatabaseToken?: string;
  betterAuthSecret?: string;
  baseURL?: string;
  allowedOrigins: string[];
}

export function loadConfig(): AppConfig {
  dotenv.config({ path: resolve(process.cwd(), "../.env") });
  dotenv.config(); // fallback to current dir .env

  const defaultOrigins = [
    `http://localhost:${process.env.FRONTEND_PORT || 5173}`,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "tauri://localhost",
    "http://tauri.localhost",
    "https://tauri.localhost",
    "asset://localhost",
    "tauri://*",
    "asset://*",
  ];

  const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || process.env.CLIENT_ORIGIN;
  const userOrigins = rawAllowedOrigins ? rawAllowedOrigins.split(",").map((o) => o.trim()) : [];

  const allowedOrigins = Array.from(new Set([...defaultOrigins, ...userOrigins]));

  return {
    port: Number(process.env.BACKEND_PORT || 3000),
    dbPath: process.env.DATABASE_PATH || "./data/lifeos.sqlite",
    frontendPort: Number(process.env.FRONTEND_PORT || 5173),
    databaseUrl: process.env.DATABASE_URL,
    tursoDatabaseToken: process.env.TURSO_DATABASE_TOKEN,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    allowedOrigins,
  };
}
