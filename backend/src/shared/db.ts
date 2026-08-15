import { type Client, createClient } from "@libsql/client";
import { logger } from "./logger.js";

const dbLog = logger.child({ module: "db" });

export function createDatabase(
  dbPath: string,
  databaseUrl?: string,
  databaseToken?: string,
): Client {
  const url = databaseUrl || (dbPath === ":memory:" ? ":memory:" : `file:${dbPath}`);
  dbLog.info("Initializing LibSQL database connection", { url });

  const client = createClient({
    url,
    authToken: databaseToken,
  });

  return client;
}
