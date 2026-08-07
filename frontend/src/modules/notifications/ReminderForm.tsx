import { useState } from "react";
import { request } from "../../lib/api.js";

import { SOUND_PRESET_OPTIONS, type SoundPreset } from "./sound-presets.js";

interface ReminderFormProps {
  taskId: string;
  taskTitle: string;
  onSubmit: (reminderTime: string, soundType: SoundPreset) => void;
  onCancel: () => void;
}

export function ReminderForm({ taskId, taskTitle, onSubmit, onCancel }: ReminderFormProps) {
  const [reminderTime, setReminderTime] = useState("");
  const [soundType, setSoundType] = useState<SoundPreset>("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTime) {
      setError("Please select a reminder time");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const isoTime = new Date(reminderTime).toISOString();

      await request<void>("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          reminderTime: isoTime,
          soundType,
        }),
      });

      onSubmit(isoTime, soundType);
    } catch (error) {
      console.error("Error creating reminder:", error);
      setError("Failed to create reminder. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 text-primary">
      <h3 className="font-semibold text-primary mb-3">Set Reminder for: {taskTitle}</h3>
      {error && (
        <div className="bg-red-900/40 border border-red-800 text-red-300 px-3 py-2 rounded-lg text-xs mb-3">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="reminder-time" className="block text-xs font-medium text-secondary mb-1">
            Reminder Time
          </label>
          <input
            id="reminder-time"
            type="datetime-local"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-full bg-card-hover border border-border-subtle text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            required
          />
        </div>
        <div>
          <label htmlFor="sound-type" className="block text-xs font-medium text-secondary mb-1">
            Sound
          </label>
          <select
            id="sound-type"
            value={soundType}
            onChange={(e) => setSoundType(e.target.value as SoundPreset)}
            className="w-full bg-card-hover border border-border-subtle text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
          >
            {SOUND_PRESET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-card-hover text-primary hover:bg-card-hover border border-border-subtle disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Setting..." : "Set Reminder"}
          </button>
        </div>
      </form>
    </div>
  );
}
