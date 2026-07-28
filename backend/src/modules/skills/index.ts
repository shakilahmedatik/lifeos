import type Database from "better-sqlite3";
import { SqliteLearningLogRepository } from "./adapters/sqlite/sqlite-learning-log-repository.js";
import { SqliteLearningResourceRepository } from "./adapters/sqlite/sqlite-learning-resource-repository.js";
import { SqliteSkillAreaRepository } from "./adapters/sqlite/sqlite-skill-area-repository.js";
import { createSkillsRouter } from "./api/router.js";
import { LearningLogService } from "./application/learning-log-service.js";
import { LearningResourceService } from "./application/learning-resource-service.js";
import { SkillAreaService } from "./application/skill-area-service.js";

export function initSkillsModule(db: Database.Database) {
  const skillAreaRepo = new SqliteSkillAreaRepository(db);
  const resourceRepo = new SqliteLearningResourceRepository(db);
  const learningLogRepo = new SqliteLearningLogRepository(db);

  const skillAreaService = new SkillAreaService(skillAreaRepo);
  const resourceService = new LearningResourceService(resourceRepo);
  const learningLogService = new LearningLogService(learningLogRepo, resourceRepo, skillAreaRepo);

  const router = createSkillsRouter(skillAreaService, resourceService, learningLogService);

  return {
    skillAreaService,
    resourceService,
    learningLogService,
    router,
  };
}
