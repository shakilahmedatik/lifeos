// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { useLearningLogs } from "../useLearningLogs";
import { useLearningResources } from "../useLearningResources";
import { useSkillAreas } from "../useSkillCategories";

describe("useSkillAreas", () => {
  it("is a function", () => {
    expect(typeof useSkillAreas).toBe("function");
  });
});

describe("useLearningResources", () => {
  it("is a function", () => {
    expect(typeof useLearningResources).toBe("function");
  });
});

describe("useLearningLogs", () => {
  it("is a function", () => {
    expect(typeof useLearningLogs).toBe("function");
  });
});
