import type { AppConfig } from "../../config.js";
import type { createRssFetchService } from "../news/application/rss-fetch-service.js";
import { createCronRouter } from "./router.js";

type RssFetchService = ReturnType<typeof createRssFetchService>;

export function initCronModule(rssFetchService: RssFetchService, config: AppConfig) {
  const router = createCronRouter(rssFetchService, config);
  return { router };
}
