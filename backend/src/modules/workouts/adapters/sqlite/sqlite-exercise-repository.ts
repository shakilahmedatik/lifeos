import type Database from "better-sqlite3";

import type { Exercise, NewExerciseInput } from "../../domain/types.js";
import type { ExerciseRepository } from "../../ports/exercise-repository.js";

interface ExerciseRow {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  video_url: string | null;
  created_at: string;
  updated_at: string;
}

function rowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group as Exercise["muscleGroup"],
    equipment: row.equipment as Exercise["equipment"],
    videoUrl: row.video_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteExerciseRepository implements ExerciseRepository {
  constructor(private readonly db: Database.Database) {}

  getById(id: string): Exercise | undefined {
    const row = this.db.prepare("SELECT * FROM exercises WHERE id = ?").get(id) as
      | ExerciseRow
      | undefined;
    return row ? rowToExercise(row) : undefined;
  }

  getAll(): Exercise[] {
    const rows = this.db.prepare("SELECT * FROM exercises ORDER BY name").all() as ExerciseRow[];
    return rows.map(rowToExercise);
  }

  getByMuscleGroup(muscleGroup: string): Exercise[] {
    const rows = this.db
      .prepare("SELECT * FROM exercises WHERE muscle_group = ? ORDER BY name")
      .all(muscleGroup) as ExerciseRow[];
    return rows.map(rowToExercise);
  }

  create(id: string, input: NewExerciseInput): Exercise {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO exercises (id, name, muscle_group, equipment, video_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.name,
        input.muscleGroup ?? "general",
        input.equipment ?? "other",
        input.videoUrl ?? null,
        now,
        now,
      );

    return this.getById(id) as Exercise;
  }

  update(id: string, patch: Partial<NewExerciseInput>): Exercise | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (patch.name !== undefined) {
      fields.push("name = ?");
      values.push(patch.name);
    }
    if (patch.muscleGroup !== undefined) {
      fields.push("muscle_group = ?");
      values.push(patch.muscleGroup);
    }
    if (patch.equipment !== undefined) {
      fields.push("equipment = ?");
      values.push(patch.equipment);
    }
    if (patch.videoUrl !== undefined) {
      fields.push("video_url = ?");
      values.push(patch.videoUrl);
    }

    if (fields.length === 0) return existing;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    this.db.prepare(`UPDATE exercises SET ${fields.join(", ")} WHERE id = ?`).run(...values);

    return this.getById(id);
  }

  delete(id: string): boolean {
    const result = this.db.prepare("DELETE FROM exercises WHERE id = ?").run(id);
    return result.changes > 0;
  }

  getByName(name: string): Exercise | undefined {
    const row = this.db.prepare("SELECT * FROM exercises WHERE name = ?").get(name) as
      | ExerciseRow
      | undefined;
    return row ? rowToExercise(row) : undefined;
  }
}
