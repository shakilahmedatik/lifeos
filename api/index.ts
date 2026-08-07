import { createApp } from "../backend/dist/app.js";
import { loadConfig } from "../backend/dist/config.js";
import { createContainer } from "../backend/dist/container.js";

const config = loadConfig();
const container = await createContainer(config);
const app = createApp(container);

export default app;
