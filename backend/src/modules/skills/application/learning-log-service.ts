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

  log(input: NewLearningLogInput): LearningLog {
    const id = randomUUID();
    return this.logRepo.create(id, input);
  }

  getByResourceId(resourceId: string): LearningLog[] {
    return this.logRepo.getByResourceId(resourceId);
  }

  getByDateRange(startDate: string, endDate: string): LearningLog[] {
    return this.logRepo.getByDateRange(startDate, endDate);
  }

  delete(id: string): boolean {
    return this.logRepo.delete(id);
  }

  getResourceProgress(resourceId: string): ResourceWithProgress | undefined {
    const resource = this.resourceRepo.getById(resourceId);
    if (!resource) return undefined;
    const skillArea = this.skillAreaRepo.getById(resource.skillAreaId);
    const logs = this.logRepo.getByResourceId(resourceId);
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

  getSkillAreaSummary(skillAreaId: string): SkillAreaSummary | undefined {
    const area = this.skillAreaRepo.getById(skillAreaId);
    if (!area) return undefined;
    const resources = this.resourceRepo.getBySkillArea(skillAreaId);
    const resourceIds = resources.map((r) => r.id);
    const allLogs = resourceIds.flatMap((rid) => this.logRepo.getByResourceId(rid));
    const totalMinutes = allLogs.reduce((s, l) => s + l.minutesSpent, 0);
    return {
      skillArea: area,
      totalResources: resources.length,
      totalMinutesSpent: totalMinutes,
      totalSessions: allLogs.length,
    };
  }
}
