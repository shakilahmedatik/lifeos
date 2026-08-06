import { createApp } from "../backend/src/app.js";
import { loadConfig } from "../backend/src/config.js";
import { createContainer } from "../backend/src/container.js";

const config = loadConfig();
const container = await createContainer(config);
const app = createApp(container);

export default app;
