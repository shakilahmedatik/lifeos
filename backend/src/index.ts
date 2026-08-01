import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createContainer } from "./container.js";
import { logger } from "./shared/logger.js";

const config = loadConfig();
const container = createContainer(config);
const app = createApp(container);

container.startBackgroundJobs();

const server = app.listen(config.port, "127.0.0.1", () => {
  logger.info("LifeOS backend started", {
    port: config.port,
    url: `http://127.0.0.1:${config.port}`,
  });
});

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);
  container.stopBackgroundJobs();
  server.close(() => {
    container.db.close();
    logger.info("Server closed");
    process.exit(0);
  });
  // Force exit after 5s if graceful shutdown fails
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 5000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { error: err.message, stack: err.stack });
  shutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { reason: String(reason) });
});
