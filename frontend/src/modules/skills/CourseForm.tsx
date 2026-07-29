import { useState } from "react";
import type {
  LearningResource,
  LearningResourceType,
  LearningUnit,
  NewLearningResourceInput,
  SkillArea,
} from "./types";

interface CourseFormProps {
  resource?: LearningResource;
  areas: SkillArea[];
  onSubmit: (input: NewLearningResourceInput) => void;
  onCancel: () => void;
}

export default function CourseForm({ resource, areas, onSubmit, onCancel }: CourseFormProps) {
  const [title, setTitle] = useState(resource?.title ?? "");
  const [skillAreaId, setSkillAreaId] = useState(
    resource?.skillAreaId ?? (areas.length > 0 ? areas[0].id : ""),
  );
  const [type, setType] = useState<LearningResourceType>(resource?.type ?? "course");
  const [totalUnits, setTotalUnits] = useState(resource?.totalUnits ?? "");
  const [unit, setUnit] = useState<LearningUnit | "">(resource?.unit ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      skillAreaId,
      type,
      totalUnits: totalUnits !== "" ? Number(totalUnits) : undefined,
      unit: unit || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="resource-title" className="block text-sm text-gray-400 mb-1">
          Title
        </label>
        <input
          id="resource-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
          placeholder="e.g., React Masterclass"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="resource-area" className="block text-sm text-gray-400 mb-1">
            Skill Area
          </label>
          <select
            id="resource-area"
            value={skillAreaId}
            onChange={(e) => setSkillAreaId(e.target.value)}
            className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            required
          >
            {areas.length === 0 ? (
              <option value="">No areas available</option>
            ) : (
              areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label htmlFor="resource-type" className="block text-sm text-gray-400 mb-1">
            Type
          </label>
          <select
            id="resource-type"
            value={type}
            onChange={(e) => setType(e.target.value as LearningResourceType)}
            className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
          >
            <option value="course">Course</option>
            <option value="book">Book</option>
            <option value="project">Project</option>
            <option value="article">Article</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="resource-units" className="block text-sm text-gray-400 mb-1">
            Total Units
          </label>
          <input
            id="resource-units"
            type="number"
            min="1"
            step="0.5"
            value={totalUnits}
            onChange={(e) => setTotalUnits(e.target.value)}
            className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
            placeholder="Optional"
          />
        </div>
        <div>
          <label htmlFor="resource-unit" className="block text-sm text-gray-400 mb-1">
            Unit Type
          </label>
          <select
            id="resource-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as LearningUnit | "")}
            className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
          >
            <option value="">None</option>
            <option value="chapters">Chapters</option>
            <option value="videos">Videos</option>
            <option value="hours">Hours</option>
          </select>
        </div>
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
          {resource ? "Update" : "Add Resource"}
        </button>
      </div>
    </form>
  );
}
