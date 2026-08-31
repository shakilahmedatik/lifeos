import type { Client } from "@libsql/client";

import type { Exercise, NewExerciseInput } from "../../domain/types.js";
import type { ExerciseRepository } from "../../ports/exercise-repository.js";

interface ExerciseRow {
  id: string;
  name: string;
  category?: string;
  muscle_group?: string;
  equipment: string;
  video_url: string | null;
  created_at: string;
  updated_at?: string;
}

function rowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: (row.category || row.muscle_group || "general") as Exercise["muscleGroup"],
    equipment: row.equipment as Exercise["equipment"],
    videoUrl: row.video_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

export class SqliteExerciseRepository implements ExerciseRepository {
  constructor(private readonly client: Client) {}

  async getById(id: string, _userId?: string): Promise<Exercise | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM exercises WHERE id = ? AND deleted_at IS NULL",
      args: [id],
    });
    const row = res.rows[0] as unknown as ExerciseRow | undefined;
    return row ? rowToExercise(row) : undefined;
  }

  async getAll(_userId?: string): Promise<Exercise[]> {
    const res = await this.client.execute("SELECT * FROM exercises WHERE deleted_at IS NULL ORDER BY name");
    const rows = res.rows as unknown as ExerciseRow[];
    return rows.map(rowToExercise);
  }

  async getByMuscleGroup(muscleGroup: string, _userId?: string): Promise<Exercise[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM exercises WHERE category = ? AND deleted_at IS NULL ORDER BY name",
      args: [muscleGroup],
    });
    const rows = res.rows as unknown as ExerciseRow[];
    return rows.map(rowToExercise);
  }

  async create(id: string, input: NewExerciseInput, _userId?: string): Promise<Exercise> {
    const now = new Date().toISOString();
    await this.client.execute({
      sql: `INSERT INTO exercises (id, name, category, equipment, video_url, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        input.name,
        input.muscleGroup ?? "general",
        input.equipment ?? "other",
        input.videoUrl ?? null,
        now,
        now,
      ],
    });

    return (await this.getById(id)) as Exercise;
  }

  async update(
    id: string,
    patch: Partial<NewExerciseInput>,
    _userId?: string,
  ): Promise<Exercise | undefined> {
    const existing = await this.getById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (patch.name !== undefined) {
      fields.push("name = ?");
      values.push(patch.name);
    }
    if (patch.muscleGroup !== undefined) {
      fields.push("category = ?");
      values.push(patch.muscleGroup);
    }
    if (patch.equipment !== undefined) {
      fields.push("equipment = ?");
      values.push(patch.equipment);
    }
    if (patch.videoUrl !== undefined) {
      fields.push("video_url = ?");
      values.push(patch.videoUrl ?? null);
    }

    if (fields.length === 0) return existing;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.client.execute({
      sql: `UPDATE exercises SET ${fields.join(", ")} WHERE id = ? AND deleted_at IS NULL`,
      args: values,
    });

    return await this.getById(id);
  }

  async delete(id: string, _userId?: string): Promise<boolean> {
    const now = new Date().toISOString();
    const res = await this.client.execute({
      sql: "UPDATE exercises SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
      args: [now, now, id],
    });
    return res.rowsAffected > 0;
  }

  async getByName(name: string, _userId?: string): Promise<Exercise | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM exercises WHERE name = ? AND deleted_at IS NULL",
      args: [name],
    });
    const row = res.rows[0] as unknown as ExerciseRow | undefined;
    return row ? rowToExercise(row) : undefined;
  }
}
