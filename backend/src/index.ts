import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { type Container, createContainer } from "./container.js";
import { logger } from "./shared/logger.js";

const log = logger.child({ module: "server" });

// Register global error handlers FIRST so startup failures are caught
process.on("uncaughtException", (err) => {
  log.error("Uncaught exception", { error: err.message, stack: err.stack });
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  log.error("Unhandled rejection", { reason: String(reason) });
});

async function main() {
  const config = loadConfig();

  let container: Container;
  try {
    container = await createContainer(config);
  } catch (err) {
    log.error("Failed to initialize — is the database reachable?", {
      error: (err as Error).message,
      stack: (err as Error).stack,
    });
    process.exit(1);
  }

  const app = createApp(container);
  container.startBackgroundJobs();

  const server = app.listen(config.port, "127.0.0.1", () => {
    log.info("LifeOS backend started", {
      port: config.port,
      url: `http://127.0.0.1:${config.port}`,
    });
  });

  function shutdown(signal: string) {
    log.info(`${signal} received, shutting down gracefully`);
    container.stopBackgroundJobs();
    server.close(() => {
      container.db.close();
      log.info("Server closed");
      process.exit(0);
    });
    // Force exit after 5s if graceful shutdown fails
    setTimeout(() => {
      log.error("Forced shutdown after timeout");
      process.exit(1);
    }, 5000);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main();
