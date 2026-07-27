import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createContainer } from "./container.js";

const config = loadConfig();
const container = createContainer(config);
const app = createApp(container);

container.startBackgroundJobs();

app.listen(config.port, "127.0.0.1", () => {
  console.log(`LifeOS backend running on http://127.0.0.1:${config.port}`);
});
