import type { Client } from "@libsql/client";
import { SqliteLearningLogRepository } from "./adapters/sqlite/sqlite-learning-log-repository.js";
import { SqliteLearningResourceRepository } from "./adapters/sqlite/sqlite-learning-resource-repository.js";
import { SqliteSkillAreaRepository } from "./adapters/sqlite/sqlite-skill-area-repository.js";
import { createSkillsRouter } from "./api/router.js";
import { LearningLogService } from "./application/learning-log-service.js";
import { LearningResourceService } from "./application/learning-resource-service.js";
import { SkillAreaService } from "./application/skill-area-service.js";

export function initSkillsModule(client: Client) {
  const skillAreaRepo = new SqliteSkillAreaRepository(client);
  const resourceRepo = new SqliteLearningResourceRepository(client);
  const learningLogRepo = new SqliteLearningLogRepository(client);

  const skillAreaService = new SkillAreaService(skillAreaRepo);
  const resourceService = new LearningResourceService(resourceRepo, skillAreaRepo);
  const learningLogService = new LearningLogService(learningLogRepo, resourceRepo, skillAreaRepo);

  const router = createSkillsRouter(skillAreaService, resourceService, learningLogService);

  return {
    skillAreaService,
    resourceService,
    learningLogService,
    router,
  };
}
