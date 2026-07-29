import type {
  LearningLog,
  LearningResource,
  LearningResourceType,
  LearningUnit,
  NewLearningLogInput,
  NewLearningResourceInput,
  NewSkillAreaInput,
  ResourceWithProgress,
  SkillArea,
  SkillAreaSummary,
  UpdateLearningLogInput,
  UpdateLearningResourceInput,
  UpdateSkillAreaInput,
} from "@lifeos/contracts";

export type {
  LearningLog,
  LearningResource,
  LearningResourceType,
  LearningUnit,
  NewLearningLogInput,
  NewLearningResourceInput,
  NewSkillAreaInput,
  ResourceWithProgress,
  SkillArea,
  SkillAreaSummary,
  UpdateLearningLogInput,
  UpdateLearningResourceInput,
  UpdateSkillAreaInput,
};

export interface LearningBackup {
  id: string;
  timestamp: string;
  version: string;
  schema: string;
  data: {
    areas: SkillArea[];
    resources: LearningResource[];
    logs: LearningLog[];
  };
}
