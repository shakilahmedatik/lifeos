import { and, asc, eq, isNull, or } from "drizzle-orm";

import type { DrizzleClient } from "../../../../shared/db.js";
import { exercises } from "../../../../shared/schema.js";
import type { Exercise, NewExerciseInput } from "../../domain/types.js";
import type { ExerciseRepository } from "../../ports/exercise-repository.js";

function rowToExercise(row: typeof exercises.$inferSelect): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: (row.category || "general") as Exercise["muscleGroup"],
    equipment: row.equipment as Exercise["equipment"],
    videoUrl: row.videoUrl ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt || row.createdAt,
  };
}

function userScope(userId: string) {
  return and(
    or(eq(exercises.userId, userId), eq(exercises.userId, "")),
    isNull(exercises.deletedAt),
  );
}

export class DrizzleExerciseRepository implements ExerciseRepository {
  constructor(private readonly db: DrizzleClient) {}

  async getById(id: string, userId = "default"): Promise<Exercise | undefined> {
    const [row] = await this.db
      .select()
      .from(exercises)
      .where(and(eq(exercises.id, id), userScope(userId)));
    return row ? rowToExercise(row) : undefined;
  }

  async getAll(userId = "default"): Promise<Exercise[]> {
    const rows = await this.db
      .select()
      .from(exercises)
      .where(userScope(userId))
      .orderBy(asc(exercises.name));
    return rows.map(rowToExercise);
  }

  async getByMuscleGroup(muscleGroup: string, userId = "default"): Promise<Exercise[]> {
    const rows = await this.db
      .select()
      .from(exercises)
      .where(and(eq(exercises.category, muscleGroup), userScope(userId)))
      .orderBy(asc(exercises.name));
    return rows.map(rowToExercise);
  }

  async create(id: string, input: NewExerciseInput, userId = "default"): Promise<Exercise> {
    const now = new Date().toISOString();
    await this.db.insert(exercises).values({
      id,
      userId,
      name: input.name,
      category: input.muscleGroup ?? "general",
      equipment: input.equipment ?? "other",
      videoUrl: input.videoUrl ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return (await this.getById(id, userId)) as Exercise;
  }

  async update(
    id: string,
    patch: Partial<NewExerciseInput>,
    userId = "default",
  ): Promise<Exercise | undefined> {
    const existing = await this.getById(id, userId);
    if (!existing) return undefined;

    const updates: Record<string, unknown> = {};
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.muscleGroup !== undefined) updates.category = patch.muscleGroup;
    if (patch.equipment !== undefined) updates.equipment = patch.equipment;
    if (patch.videoUrl !== undefined) updates.videoUrl = patch.videoUrl ?? null;

    if (Object.keys(updates).length === 0) return existing;

    updates.updatedAt = new Date().toISOString();

    await this.db
      .update(exercises)
      .set(updates)
      .where(and(eq(exercises.id, id), userScope(userId)));

    return await this.getById(id, userId);
  }

  async delete(id: string, userId = "default"): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .update(exercises)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(exercises.id, id), userScope(userId)));
    return result.rowsAffected > 0;
  }

  async getByName(name: string, userId = "default"): Promise<Exercise | undefined> {
    const [row] = await this.db
      .select()
      .from(exercises)
      .where(and(eq(exercises.name, name), userScope(userId)));
    return row ? rowToExercise(row) : undefined;
  }
}
