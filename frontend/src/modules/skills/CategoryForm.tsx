import { useState } from "react";
import type { NewSkillAreaInput, SkillArea } from "./types";

interface CategoryFormProps {
  category?: SkillArea;
  onSubmit: (input: NewSkillAreaInput) => void;
  onCancel: () => void;
}

export default function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="category-name" className="block text-sm text-gray-400 mb-1">
          Skill Area Name
        </label>
        <input
          id="category-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
          placeholder="e.g., Programming, Design, Language"
          required
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600/30 transition-colors"
        >
          {category ? "Update" : "Create Area"}
        </button>
      </div>
    </form>
  );
}
