import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { logger } from "./logger.js";
import * as schema from "./schema.js";

const dbLog = logger.child({ module: "db" });

export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

export function createDatabase(
  dbPath: string,
  databaseUrl?: string,
  databaseToken?: string,
): { db: DrizzleClient } {
  const url = databaseUrl || (dbPath === ":memory:" ? ":memory:" : `file:${dbPath}`);
  dbLog.info("Initializing LibSQL database connection", { url });

  const rawClient = createClient({
    url,
    authToken: databaseToken,
  });

  const db = drizzle(rawClient, { schema });

  return { db };
}
