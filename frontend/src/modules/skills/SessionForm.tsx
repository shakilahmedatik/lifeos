import { useState } from "react";
import type { LearningLog, LearningResource, NewLearningLogInput } from "./types";

interface SessionFormProps {
  log?: LearningLog;
  resources: LearningResource[];
  initialResourceId?: string;
  initialMinutesSpent?: number;
  onSubmit: (input: NewLearningLogInput) => void;
  onCancel: () => void;
}

export default function SessionForm({
  log,
  resources,
  initialResourceId,
  initialMinutesSpent,
  onSubmit,
  onCancel,
}: SessionFormProps) {
  const [date, setDate] = useState(log?.date ?? new Date().toISOString().split("T")[0]);
  const [minutesSpent, setMinutesSpent] = useState(log?.minutesSpent ?? initialMinutesSpent ?? 30);
  const [resourceId, setResourceId] = useState(
    log?.resourceId ?? initialResourceId ?? (resources.length > 0 ? resources[0].id : ""),
  );
  const [unitsCompleted, setUnitsCompleted] = useState(log?.unitsCompleted ?? "");
  const [notes, setNotes] = useState(log?.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date,
      minutesSpent,
      resourceId,
      unitsCompleted: unitsCompleted !== "" ? Number(unitsCompleted) : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="log-date" className="block text-sm text-gray-400 mb-1">
            Date
          </label>
          <input
            id="log-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            required
          />
        </div>
        <div>
          <label htmlFor="log-minutes" className="block text-sm text-gray-400 mb-1">
            Minutes
          </label>
          <input
            id="log-minutes"
            type="number"
            min="1"
            value={minutesSpent}
            onChange={(e) => setMinutesSpent(Number(e.target.value))}
            className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            required
          />
        </div>
      </div>
      <div>
        <label htmlFor="log-resource" className="block text-sm text-gray-400 mb-1">
          Learning Resource
        </label>
        <select
          id="log-resource"
          value={resourceId}
          onChange={(e) => setResourceId(e.target.value)}
          className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
          required
        >
          {resources.length === 0 ? (
            <option value="">No resources available</option>
          ) : (
            resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))
          )}
        </select>
      </div>
      <div>
        <label htmlFor="log-units" className="block text-sm text-gray-400 mb-1">
          Units Completed
        </label>
        <input
          id="log-units"
          type="number"
          min="0"
          step="0.5"
          value={unitsCompleted}
          onChange={(e) => setUnitsCompleted(e.target.value)}
          className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
          placeholder="Optional"
        />
      </div>
      <div>
        <label htmlFor="log-notes" className="block text-sm text-gray-400 mb-1">
          Notes
        </label>
        <textarea
          id="log-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500 resize-none"
          rows={2}
          placeholder="Optional notes"
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
          {log ? "Update" : "Log Session"}
        </button>
      </div>
    </form>
  );
}
