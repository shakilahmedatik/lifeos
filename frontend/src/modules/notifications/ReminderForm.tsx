import { useState } from "react";
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

      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          reminderTime,
          soundType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create reminder");
      }

      onSubmit(reminderTime, soundType);
    } catch (error) {
      console.error("Error creating reminder:", error);
      setError("Failed to create reminder. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Set Reminder for: {taskTitle}</h3>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="reminder-time" className="block text-sm font-medium mb-1">
            Reminder Time
          </label>
          <input
            id="reminder-time"
            type="datetime-local"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label htmlFor="sound-type" className="block text-sm font-medium mb-1">
            Sound
          </label>
          <select
            id="sound-type"
            value={soundType}
            onChange={(e) => setSoundType(e.target.value as SoundPreset)}
            className="w-full border rounded px-3 py-2"
          >
            {SOUND_PRESET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Setting..." : "Set Reminder"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
