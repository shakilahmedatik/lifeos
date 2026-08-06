import { beforeEach, describe, expect, it } from "vitest";
import { LearningLogService } from "../application/learning-log-service.js";
import { LearningResourceService } from "../application/learning-resource-service.js";
import { SkillAreaService } from "../application/skill-area-service.js";
import type {
  LearningLog,
  LearningResource,
  NewLearningLogInput,
  NewLearningResourceInput,
  NewSkillAreaInput,
  ResourceWithProgress,
  SkillArea,
  SkillAreaSummary,
} from "../domain/types.js";
import type { LearningLogRepository } from "../ports/learning-log-repository.js";
import type { LearningResourceRepository } from "../ports/learning-resource-repository.js";
import type { SkillAreaRepository } from "../ports/skill-area-repository.js";

function createMockSkillAreaRepo(): SkillAreaRepository & { areas: Map<string, SkillArea> } {
  const areas = new Map<string, SkillArea>();
  return {
    areas,
    async getById(id: string) {
      return areas.get(id);
    },
    async getAll() {
      return Array.from(areas.values());
    },
    async getByName(name: string) {
      return Array.from(areas.values()).find((a) => a.name === name);
    },
    async create(id: string, input: NewSkillAreaInput) {
      const now = new Date().toISOString();
      const area: SkillArea = {
        id,
        name: input.name,
        weeklyGoalHours: input.weeklyGoalHours ?? 5,
        createdAt: now,
        updatedAt: now,
      };
      areas.set(id, area);
      return area;
    },
    async update(id: string, patch: Partial<NewSkillAreaInput>) {
      const existing = areas.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      areas.set(id, updated);
      return updated;
    },
    async delete(id: string) {
      return areas.delete(id);
    },
  };
}

function createMockLearningResourceRepo(): LearningResourceRepository & {
  resources: Map<string, LearningResource>;
} {
  const resources = new Map<string, LearningResource>();
  return {
    resources,
    async getById(id: string) {
      return resources.get(id);
    },
    async getAll() {
      return Array.from(resources.values());
    },
    async getBySkillArea(skillAreaId: string) {
      return Array.from(resources.values()).filter((r) => r.skillAreaId === skillAreaId);
    },
    async create(id: string, input: NewLearningResourceInput) {
      const now = new Date().toISOString();
      const resource: LearningResource = {
        id,
        skillAreaId: input.skillAreaId,
        title: input.title,
        type: input.type,
        totalUnits: input.totalUnits,
        unit: input.unit,
        createdAt: now,
        updatedAt: now,
      };
      resources.set(id, resource);
      return resource;
    },
    async update(id: string, patch: Partial<NewLearningResourceInput>) {
      const existing = resources.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      resources.set(id, updated);
      return updated;
    },
    async delete(id: string) {
      return resources.delete(id);
    },
  };
}

function createMockLearningLogRepo(): LearningLogRepository & {
  logs: Map<string, LearningLog>;
} {
  const logs = new Map<string, LearningLog>();
  return {
    logs,
    async getById(id: string) {
      return logs.get(id);
    },
    async getByResourceId(resourceId: string) {
      return Array.from(logs.values()).filter((l) => l.resourceId === resourceId);
    },
    async getByDateRange(startDate: string, endDate: string) {
      return Array.from(logs.values()).filter((l) => l.date >= startDate && l.date <= endDate);
    },
    async getByResourceIds(resourceIds: string[], startDate?: string, endDate?: string) {
      return Array.from(logs.values()).filter(
        (l) =>
          resourceIds.includes(l.resourceId) &&
          (!startDate || l.date >= startDate) &&
          (!endDate || l.date <= endDate),
      );
    },
    async create(id: string, input: NewLearningLogInput) {
      const now = new Date().toISOString();
      const log: LearningLog = {
        id,
        resourceId: input.resourceId,
        date: input.date,
        minutesSpent: input.minutesSpent,
        unitsCompleted: input.unitsCompleted,
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      };
      logs.set(id, log);
      return log;
    },
    async update(id: string, patch: Partial<NewLearningLogInput>) {
      const existing = logs.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      logs.set(id, updated);
      return updated;
    },
    async delete(id: string) {
      return logs.delete(id);
    },
  };
}

describe("SkillAreaService", () => {
  let service: SkillAreaService;
  let repo: ReturnType<typeof createMockSkillAreaRepo>;

  beforeEach(() => {
    repo = createMockSkillAreaRepo();
    service = new SkillAreaService(repo);
  });

  it("creates a skill area", async () => {
    const area = await service.create({ name: "Programming" });
    expect(area.name).toBe("Programming");
    expect(repo.areas.size).toBe(1);
  });

  it("rejects duplicate names", async () => {
    await service.create({ name: "Programming" });
    await expect(service.create({ name: "Programming" })).rejects.toThrow(
      "Skill area with this name already exists",
    );
  });

  it("lists all skill areas", async () => {
    await service.create({ name: "Programming" });
    await service.create({ name: "Design" });
    expect(await service.list()).toHaveLength(2);
  });

  it("gets a skill area by id", async () => {
    const area = await service.create({ name: "Programming" });
    const found = await service.getById(area.id);
    expect(found?.name).toBe("Programming");
  });

  it("updates a skill area", async () => {
    const area = await service.create({ name: "Programming" });
    const updated = await service.update(area.id, { name: "Coding" });
    expect(updated?.name).toBe("Coding");
  });

  it("rejects duplicate name for existing area update", async () => {
    await service.create({ name: "Programming" });
    await service.create({ name: "Design" });
    await expect(service.update("design-id", { name: "Programming" })).rejects.toThrow(
      "Skill area with this name already exists",
    );
  });

  it("deletes a skill area", async () => {
    const area = await service.create({ name: "Programming" });
    expect(await service.delete(area.id)).toBe(true);
    expect(repo.areas.size).toBe(0);
  });

  it("returns undefined for non-existent area update", async () => {
    const result = await service.update("non-existent-id", { name: "Nothing" });
    expect(result).toBeUndefined();
  });
});

describe("LearningResourceService", () => {
  let service: LearningResourceService;
  let resourceRepo: ReturnType<typeof createMockLearningResourceRepo>;
  let skillAreaRepo: ReturnType<typeof createMockSkillAreaRepo>;

  beforeEach(() => {
    resourceRepo = createMockLearningResourceRepo();
    skillAreaRepo = createMockSkillAreaRepo();
    service = new LearningResourceService(resourceRepo, skillAreaRepo);
  });

  it("creates a learning resource when area exists", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const resource = await service.create({
      skillAreaId: area.id,
      title: "TypeScript Course",
      type: "course",
    });
    expect(resource.title).toBe("TypeScript Course");
    expect(resource.skillAreaId).toBe(area.id);
    expect(resourceRepo.resources.size).toBe(1);
  });

  it("rejects creation when skill area doesn't exist", async () => {
    await expect(
      service.create({
        skillAreaId: "non-existent-area",
        title: "Bad Resource",
        type: "book",
      }),
    ).rejects.toThrow("Skill area not found");
  });

  it("lists all resources", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const area2 = await skillAreaRepo.create("area-2", { name: "Design" });
    await service.create({ skillAreaId: area.id, title: "Resource 1", type: "course" });
    await service.create({ skillAreaId: area2.id, title: "Resource 2", type: "book" });
    expect(await service.list()).toHaveLength(2);
  });

  it("gets resources by skill area", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const area2 = await skillAreaRepo.create("area-2", { name: "Design" });
    await service.create({ skillAreaId: area.id, title: "TS Course", type: "course" });
    await service.create({ skillAreaId: area.id, title: "JS Book", type: "book" });
    await service.create({ skillAreaId: area2.id, title: "Figma Tutorial", type: "project" });
    const resources = await service.getBySkillArea(area.id);
    expect(resources).toHaveLength(2);
    expect(resources.every((r) => r.skillAreaId === area.id)).toBe(true);
  });

  it("gets a resource by id", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const resource = await service.create({
      skillAreaId: area.id,
      title: "TypeScript Course",
      type: "course",
    });
    const found = await service.getById(resource.id);
    expect(found?.title).toBe("TypeScript Course");
  });

  it("updates a resource", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const resource = await service.create({
      skillAreaId: area.id,
      title: "TypeScript Course",
      type: "course",
    });
    const updated = await service.update(resource.id, { title: "Advanced TypeScript" });
    expect(updated?.title).toBe("Advanced TypeScript");
  });

  it("validates skillAreaId in update (rejects invalid skillAreaId)", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const resource = await service.create({
      skillAreaId: area.id,
      title: "TypeScript Course",
      type: "course",
    });
    await expect(service.update(resource.id, { skillAreaId: "non-existent-area" })).rejects.toThrow(
      "Skill area not found",
    );
  });

  it("allows update without changing skillAreaId", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const resource = await service.create({
      skillAreaId: area.id,
      title: "TypeScript Course",
      type: "course",
    });
    const updated = await service.update(resource.id, { title: "Better TypeScript" });
    expect(updated?.title).toBe("Better TypeScript");
  });

  it("deletes a resource", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const resource = await service.create({
      skillAreaId: area.id,
      title: "TypeScript Course",
      type: "course",
    });
    expect(await service.delete(resource.id)).toBe(true);
    expect(resourceRepo.resources.size).toBe(0);
  });

  it("returns undefined for non-existent resource", async () => {
    const result = await service.delete("non-existent-resource");
    expect(result).toBe(false);
  });
});

describe("LearningLogService", () => {
  let service: LearningLogService;
  let logRepo: ReturnType<typeof createMockLearningLogRepo>;
  let resourceRepo: ReturnType<typeof createMockLearningResourceRepo>;
  let skillAreaRepo: ReturnType<typeof createMockSkillAreaRepo>;

  beforeEach(() => {
    logRepo = createMockLearningLogRepo();
    resourceRepo = createMockLearningResourceRepo();
    skillAreaRepo = createMockSkillAreaRepo();
    service = new LearningLogService(logRepo, resourceRepo, skillAreaRepo);
  });

  it("logs a learning session", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const resource = await resourceRepo.create("res-1", {
      skillAreaId: area.id,
      title: "TypeScript Course",
      type: "course",
    });
    const log = await service.log({
      resourceId: resource.id,
      date: "2025-01-15",
      minutesSpent: 45,
      unitsCompleted: 2,
    });
    expect(log.resourceId).toBe(resource.id);
    expect(log.minutesSpent).toBe(45);
    expect(log.unitsCompleted).toBe(2);
  });

  it("gets logs by resource id", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const resource = await resourceRepo.create("res-1", {
      skillAreaId: area.id,
      title: "Course",
      type: "course",
    });
    await service.log({ resourceId: resource.id, date: "2025-01-15", minutesSpent: 30 });
    await service.log({ resourceId: resource.id, date: "2025-01-16", minutesSpent: 60 });
    const logs = await service.getByResourceId(resource.id);
    expect(logs).toHaveLength(2);
  });

  it("gets logs by date range", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const resource = await resourceRepo.create("res-1", {
      skillAreaId: area.id,
      title: "Course",
      type: "course",
    });
    await service.log({ resourceId: resource.id, date: "2025-01-10", minutesSpent: 20 });
    await service.log({ resourceId: resource.id, date: "2025-01-15", minutesSpent: 40 });
    await service.log({ resourceId: resource.id, date: "2025-01-20", minutesSpent: 50 });
    const logs = await service.getByDateRange("2025-01-12", "2025-01-18");
    expect(logs).toHaveLength(1);
    expect(logs[0].date).toBe("2025-01-15");
  });

  it("computes resource progress", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const resource = await resourceRepo.create("res-1", {
      skillAreaId: area.id,
      title: "Course",
      type: "course",
      totalUnits: 10,
      unit: "chapters",
    });
    await service.log({
      resourceId: resource.id,
      date: "2025-01-15",
      minutesSpent: 45,
      unitsCompleted: 3,
    });
    await service.log({
      resourceId: resource.id,
      date: "2025-01-16",
      minutesSpent: 30,
      unitsCompleted: 2,
    });
    const progress = (await service.getResourceProgress(resource.id)) as ResourceWithProgress;
    expect(progress.totalMinutesSpent).toBe(75);
    expect(progress.totalUnitsCompleted).toBe(5);
    expect(progress.completionPercent).toBe(50);
    expect(progress.skillAreaName).toBe("Programming");
  });

  it("returns undefined for non-existent resource progress", async () => {
    const result = await service.getResourceProgress("non-existent-resource");
    expect(result).toBeUndefined();
  });

  it("computes resource progress with no total units", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const resource = await resourceRepo.create("res-1", {
      skillAreaId: area.id,
      title: "Open Course",
      type: "course",
    });
    await service.log({ resourceId: resource.id, date: "2025-01-15", minutesSpent: 45 });
    const progress = (await service.getResourceProgress(resource.id)) as ResourceWithProgress;
    expect(progress.completionPercent).toBe(0);
  });

  it("caps completion percent at 100", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const resource = await resourceRepo.create("res-1", {
      skillAreaId: area.id,
      title: "Course",
      type: "course",
      totalUnits: 2,
    });
    await service.log({
      resourceId: resource.id,
      date: "2025-01-15",
      minutesSpent: 45,
      unitsCompleted: 5,
    });
    const progress = (await service.getResourceProgress(resource.id)) as ResourceWithProgress;
    expect(progress.completionPercent).toBe(100);
  });

  it("gets skill area summary", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const resource1 = await resourceRepo.create("res-1", {
      skillAreaId: area.id,
      title: "Course 1",
      type: "course",
    });
    const resource2 = await resourceRepo.create("res-2", {
      skillAreaId: area.id,
      title: "Book 1",
      type: "book",
    });
    await service.log({ resourceId: resource1.id, date: "2025-01-15", minutesSpent: 45 });
    await service.log({ resourceId: resource1.id, date: "2025-01-16", minutesSpent: 30 });
    await service.log({ resourceId: resource2.id, date: "2025-01-17", minutesSpent: 60 });
    const summary = (await service.getSkillAreaSummary(area.id)) as SkillAreaSummary;
    expect(summary.totalResources).toBe(2);
    expect(summary.totalMinutesSpent).toBe(135);
    expect(summary.totalSessions).toBe(3);
    expect(summary.skillArea.name).toBe("Programming");
  });

  it("filters skill area summary by date range", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const resource = await resourceRepo.create("res-1", {
      skillAreaId: area.id,
      title: "Course 1",
      type: "course",
    });
    await service.log({ resourceId: resource.id, date: "2025-01-10", minutesSpent: 60 });
    await service.log({ resourceId: resource.id, date: "2025-01-15", minutesSpent: 30 });
    await service.log({ resourceId: resource.id, date: "2025-01-20", minutesSpent: 90 });

    const summary = await service.getSkillAreaSummary(area.id, "2025-01-12", "2025-01-18");
    expect(summary?.totalMinutesSpent).toBe(30);
    expect(summary?.totalSessions).toBe(1);
  });

  it("returns undefined for non-existent skill area summary", async () => {
    const result = await service.getSkillAreaSummary("non-existent-area");
    expect(result).toBeUndefined();
  });

  it("updates a log", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const resource = await resourceRepo.create("res-1", {
      skillAreaId: area.id,
      title: "Course",
      type: "course",
    });
    const log = await service.log({
      resourceId: resource.id,
      date: "2025-01-15",
      minutesSpent: 30,
      notes: "Started",
    });
    const updated = await service.updateLog(log.id, { minutesSpent: 45, notes: "Extended" });
    expect(updated?.minutesSpent).toBe(45);
    expect(updated?.notes).toBe("Extended");
  });

  it("deletes a log", async () => {
    const area = await skillAreaRepo.create("area-1", { name: "Programming" });
    const resource = await resourceRepo.create("res-1", {
      skillAreaId: area.id,
      title: "Course",
      type: "course",
    });
    const log = await service.log({
      resourceId: resource.id,
      date: "2025-01-15",
      minutesSpent: 30,
    });
    expect(await service.delete(log.id)).toBe(true);
    expect(logRepo.logs.size).toBe(0);
  });
});
