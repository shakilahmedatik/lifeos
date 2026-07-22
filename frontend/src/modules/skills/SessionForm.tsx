import { useState } from "react";
import type { LearningSession, NewLearningSessionInput, SkillCategory } from "./types";

interface SessionFormProps {
  session?: LearningSession;
  categories: SkillCategory[];
  onSubmit: (input: NewLearningSessionInput) => void;
  onCancel: () => void;
}

export default function SessionForm({ session, categories, onSubmit, onCancel }: SessionFormProps) {
  const [duration, setDuration] = useState(session?.duration ?? 30);
  const [skillCategoryId, setSkillCategoryId] = useState(
    session?.skillCategoryId ?? (categories.length > 0 ? categories[0].id : ""),
  );
  const [notes, setNotes] = useState(session?.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ duration, skillCategoryId, notes });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 bg-white rounded-lg border border-gray-200"
    >
      <div>
        <label htmlFor="session-duration" className="block text-sm font-medium text-gray-700 mb-1">
          Duration (minutes)
        </label>
        <input
          id="session-duration"
          type="number"
          min="1"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label htmlFor="session-category" className="block text-sm font-medium text-gray-700 mb-1">
          Skill Category
        </label>
        <select
          id="session-category"
          value={skillCategoryId}
          onChange={(e) => setSkillCategoryId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          {categories.length === 0 ? (
            <option value="">No categories available</option>
          ) : (
            categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))
          )}
        </select>
      </div>
      <div>
        <label htmlFor="session-notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="session-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          {session ? "Update" : "Log Session"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
