import { randomUUID } from "node:crypto";

import type {
  LearningLog,
  NewLearningLogInput,
  ResourceWithProgress,
  SkillAreaSummary,
} from "../domain/types.js";
import type { LearningLogRepository } from "../ports/learning-log-repository.js";
import type { LearningResourceRepository } from "../ports/learning-resource-repository.js";
import type { SkillAreaRepository } from "../ports/skill-area-repository.js";

export class LearningLogService {
  constructor(
    private readonly logRepo: LearningLogRepository,
    private readonly resourceRepo: LearningResourceRepository,
    private readonly skillAreaRepo: SkillAreaRepository,
  ) {}

  async log(input: NewLearningLogInput, userId = "default"): Promise<LearningLog> {
    const id = randomUUID();
    return await this.logRepo.create(id, input, userId);
  }

  async getByResourceId(resourceId: string, userId = "default"): Promise<LearningLog[]> {
    return await this.logRepo.getByResourceId(resourceId, userId);
  }

  async getByDateRange(
    startDate: string,
    endDate: string,
    userId = "default",
  ): Promise<LearningLog[]> {
    return await this.logRepo.getByDateRange(startDate, endDate, userId);
  }

  async updateLog(
    id: string,
    patch: Partial<NewLearningLogInput>,
    userId = "default",
  ): Promise<LearningLog | undefined> {
    return await this.logRepo.update(id, patch, userId);
  }

  async delete(id: string, userId = "default"): Promise<boolean> {
    return await this.logRepo.delete(id, userId);
  }

  async getResourceProgress(
    resourceId: string,
    userId = "default",
  ): Promise<ResourceWithProgress | undefined> {
    const resource = await this.resourceRepo.getById(resourceId, userId);
    if (!resource) return undefined;
    const skillArea = await this.skillAreaRepo.getById(resource.skillAreaId, userId);
    const logs = await this.logRepo.getByResourceId(resourceId, userId);
    const totalMinutes = logs.reduce((s, l) => s + l.minutesSpent, 0);
    const totalUnits = logs.reduce((s, l) => s + (l.unitsCompleted ?? 0), 0);
    const pct =
      resource.totalUnits && resource.totalUnits > 0
        ? Math.min(100, Math.round((totalUnits / resource.totalUnits) * 100))
        : 0;
    return {
      ...resource,
      skillAreaName: skillArea?.name ?? "Unknown",
      totalMinutesSpent: totalMinutes,
      totalUnitsCompleted: totalUnits,
      completionPercent: pct,
    };
  }

  async getSkillAreaSummary(
    skillAreaId: string,
    startDate?: string,
    endDate?: string,
    userId = "default",
  ): Promise<SkillAreaSummary | undefined> {
    const area = await this.skillAreaRepo.getById(skillAreaId, userId);
    if (!area) return undefined;
    const resources = await this.resourceRepo.getBySkillArea(skillAreaId, userId);
    const resourceIds = resources.map((r) => r.id);
    const logs = await this.logRepo.getByResourceIds(resourceIds, startDate, endDate, userId);
    const totalMinutes = logs.reduce((s, l) => s + l.minutesSpent, 0);
    return {
      skillArea: area,
      totalResources: resources.length,
      totalMinutesSpent: totalMinutes,
      totalSessions: logs.length,
    };
  }
}
