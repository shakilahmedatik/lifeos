import process from "node:process";
import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: "../.env" });

export default defineConfig({
  dialect: "turso",
  schema: "./src/shared/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:./local.db",
    authToken: process.env.TURSO_DATABASE_TOKEN,
  },
});
