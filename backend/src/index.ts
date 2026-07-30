import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createContainer } from "./container.js";
import { logger } from "./shared/logger.js";

const config = loadConfig();
const container = createContainer(config);
const app = createApp(container);

container.startBackgroundJobs();

app.listen(config.port, "127.0.0.1", () => {
  logger.info("LifeOS backend started", {
    port: config.port,
    url: `http://127.0.0.1:${config.port}`,
  });
});
