import type { DrizzleClient } from "../../shared/db.js";
import { DrizzleLearningLogRepository } from "./adapters/sqlite/sqlite-learning-log-repository.js";
import { DrizzleLearningResourceRepository } from "./adapters/sqlite/sqlite-learning-resource-repository.js";
import { DrizzleSkillAreaRepository } from "./adapters/sqlite/sqlite-skill-area-repository.js";
import { createSkillsRouter } from "./api/router.js";
import { LearningLogService } from "./application/learning-log-service.js";
import { LearningResourceService } from "./application/learning-resource-service.js";
import { SkillAreaService } from "./application/skill-area-service.js";

export function initSkillsModule(db: DrizzleClient) {
  const skillAreaRepo = new DrizzleSkillAreaRepository(db);
  const resourceRepo = new DrizzleLearningResourceRepository(db);
  const learningLogRepo = new DrizzleLearningLogRepository(db);

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
