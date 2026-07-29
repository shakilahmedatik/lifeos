import type {
  NewTaskInput,
  NotificationSoundType,
  TaskCategory,
  TaskRecurrence,
  TaskSubtask,
} from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts";
import { useEffect, useState } from "react";
import Button from "../../components/ui/Button.js";
import Card from "../../components/ui/Card.js";
import { PlusIcon, XIcon } from "../../components/ui/icons.js";
import { useLearningResources } from "../skills/useLearningResources.js";
import { useWorkouts } from "../workouts/useWorkouts.js";

interface TaskFormProps {
  onSubmit: (input: NewTaskInput) => Promise<void>;
  onCancel: () => void;
  defaultDate: string;
}

export function getCurrentHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m + minutes) % 1440;
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

const DURATION_OPTIONS = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
  { label: "Custom", value: -1 },
];

export default function TaskForm({ onSubmit, onCancel, defaultDate }: TaskFormProps) {
  const todayStr = getClientDateString();
  const currentHHMM = getCurrentHHMM();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("general");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(currentHHMM);
  const [durationPreset, setDurationPreset] = useState<number>(30); // Default 30 mins
  const [customDurationMins, setCustomDurationMins] = useState<number>(30);
  const [endTime, setEndTime] = useState(() => addMinutesToTime(currentHHMM, 30));
  const [recurrence, setRecurrence] = useState<TaskRecurrence>("none");
  const [notes, setNotes] = useState("");

  // Subtasks
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [referenceId, setReferenceId] = useState<string>("");

  const { workouts } = useWorkouts();
  const { resources: learningResources } = useLearningResources();

  // Notifications
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(15);
  const [reminderSound, setReminderSound] = useState<NotificationSoundType | "none">("default");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Recalculate end time when startTime or duration changes
  useEffect(() => {
    if (durationPreset !== -1) {
      setEndTime(addMinutesToTime(startTime, durationPreset));
    }
  }, [startTime, durationPreset]);

  const handleCustomDurationChange = (mins: number) => {
    setCustomDurationMins(mins);
    setEndTime(addMinutesToTime(startTime, Math.max(1, mins)));
  };

  const isOvernight = startTime > endTime;
  const isPastStart = date === todayStr && startTime < currentHHMM;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      {
        id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle("");
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((st) => st.id !== id));
  };

  const resetForm = () => {
    const nowHHMM = getCurrentHHMM();
    setTitle("");
    setCategory("general");
    setDate(defaultDate);
    setStartTime(nowHHMM);
    setDurationPreset(30);
    setEndTime(addMinutesToTime(nowHHMM, 30));
    setRecurrence("none");
    setNotes("");
    setSubtasks([]);
    setNewSubtaskTitle("");
    setReferenceId("");
    setEnableReminder(false);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Task title is required");
      return;
    }

    if (startTime === endTime) {
      setFormError("Start time cannot be equal to end time");
      return;
    }

    if (isPastStart) {
      setFormError("Cannot schedule a new task starting in the past for today");
      return;
    }

    if (category === "workout" && !referenceId) {
      setFormError("Please select a workout plan for the workout task");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        title: title.trim(),
        category,
        date,
        startTime,
        endTime,
        recurrence,
        referenceId: referenceId || undefined,
        notes: notes.trim() || undefined,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        ...(enableReminder && {
          reminderMinutesBefore,
          reminderSilent: reminderSound === "none",
          reminderSound: reminderSound !== "none" ? reminderSound : undefined,
        }),
      });

      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-blue-500/30">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-100">Create New Task</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            aria-label="Cancel task creation"
          >
            Cancel
          </Button>
        </div>

        {formError && (
          <div className="p-3 bg-red-900/40 border border-red-800 rounded-lg text-xs text-red-300">
            {formError}
          </div>
        )}

        <div>
          <label htmlFor="task-title" className="block text-xs font-medium text-gray-400 mb-1">
            Task Title *
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Morning Standup or Study Session"
            className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="task-category" className="block text-xs font-medium text-gray-400 mb-1">
              Category
            </label>
            <select
              id="task-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value="general">General</option>
              <option value="work">Work</option>
              <option value="workout">Workout</option>
              <option value="learning">Learning</option>
              <option value="habit">Habit</option>
              <option value="personal">Personal</option>
            </select>
          </div>

          <div>
            <label htmlFor="task-date" className="block text-xs font-medium text-gray-400 mb-1">
              Date
            </label>
            <input
              id="task-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div>
            <label
              htmlFor="task-recurrence"
              className="block text-xs font-medium text-gray-400 mb-1"
            >
              Repeat
            </label>
            <select
              id="task-recurrence"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as TaskRecurrence)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value="none">No Repeat</option>
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays (Sun–Thu BD)</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        {category === "workout" && (
          <div>
            <label htmlFor="task-workout" className="block text-xs font-medium text-gray-400 mb-1">
              Select Workout Plan *
            </label>
            <select
              id="task-workout"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              required
            >
              <option value="">Select a workout...</option>
              {workouts
                .filter((w) => (w.exerciseCount || 0) > 0)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {category === "learning" && (
          <div>
            <label
              htmlFor="task-learning-resource"
              className="block text-xs font-medium text-gray-400 mb-1"
            >
              Select Learning Resource (Optional)
            </label>
            <select
              id="task-learning-resource"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value="">No linked resource</option>
              {learningResources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Start Time & Duration Selection */}
        <div className="space-y-2 bg-gray-800/40 p-3 rounded-xl border border-gray-700/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="task-start-time"
                className="block text-xs font-medium text-gray-400 mb-1"
              >
                Start Time (Defaults to Current Time)
              </label>
              <input
                id="task-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full bg-gray-700/50 border text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${
                  isPastStart
                    ? "border-amber-500/80 text-amber-300"
                    : "border-gray-600/50 focus:border-blue-500/50"
                }`}
              />
              {isPastStart && (
                <p className="text-[11px] text-amber-400 mt-1">
                  ⚠️ Selected time is in the past for today.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="task-end-time"
                className="block text-xs font-medium text-gray-400 mb-1"
              >
                Calculated End Time ({endTime})
              </label>
              <input
                id="task-end-time"
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setDurationPreset(-1); // Switch to custom if manually changed
                }}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          {/* Quick Duration Buttons */}
          <div>
            <span className="block text-xs font-medium text-gray-400 mb-1.5">
              Task Duration Preset:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    setDurationPreset(opt.value);
                    if (opt.value !== -1) {
                      setEndTime(addMinutesToTime(startTime, opt.value));
                    }
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                    durationPreset === opt.value
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {durationPreset === -1 && (
              <div className="mt-2 flex items-center gap-2">
                <label htmlFor="custom-duration-input" className="text-xs text-gray-400">
                  Custom Minutes:
                </label>
                <input
                  id="custom-duration-input"
                  type="number"
                  min="1"
                  max="1440"
                  value={customDurationMins}
                  onChange={(e) => handleCustomDurationChange(Number(e.target.value))}
                  className="w-24 bg-gray-700/50 border border-gray-600/50 text-gray-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            )}
          </div>
        </div>

        {isOvernight && (
          <div className="text-xs text-amber-400 flex items-center gap-1.5 bg-amber-500/10 p-2 rounded border border-amber-500/20">
            <span>🌙</span>
            <span>Spans overnight (ends next morning at {endTime})</span>
          </div>
        )}

        {/* Sub-tasks / Todo Checklist Builder */}
        <div className="space-y-2 bg-gray-800/40 p-3 rounded-xl border border-gray-700/40">
          <label className="block text-xs font-medium text-gray-300">
            Sub-tasks Checklist / Todos (Optional)
          </label>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Add a sub-task or item..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              className="flex-1 bg-gray-700/50 border border-gray-600/50 text-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={<PlusIcon size={14} />}
              onClick={handleAddSubtask}
            >
              Add
            </Button>
          </div>

          {subtasks.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {subtasks.map((st, idx) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30 border border-gray-600/30 text-xs text-gray-200"
                >
                  <span className="truncate flex-1">
                    {idx + 1}. {st.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    aria-label={`Remove subtask ${st.title}`}
                    className="text-gray-400 hover:text-red-400 p-1"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="task-notes" className="block text-xs font-medium text-gray-400 mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="task-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add details, sub-tasks, or links..."
            rows={2}
            className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500 resize-none"
          />
        </div>

        {/* Reminder Settings */}
        <div className="space-y-2 pt-1 border-t border-gray-700/40">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={enableReminder}
              onChange={(e) => setEnableReminder(e.target.checked)}
              className="rounded bg-gray-700 border-gray-600 accent-blue-500"
            />
            <span>Set Reminder Notification</span>
          </label>

          {enableReminder && (
            <div className="grid grid-cols-2 gap-3 pl-6">
              <div>
                <label htmlFor="task-reminder-timing" className="block text-xs text-gray-400 mb-1">
                  Timing
                </label>
                <select
                  id="task-reminder-timing"
                  value={reminderMinutesBefore}
                  onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                  className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500/50"
                >
                  <option value={5}>5 min before</option>
                  <option value={10}>10 min before</option>
                  <option value={15}>15 min before</option>
                  <option value={30}>30 min before</option>
                  <option value={60}>1 hour before</option>
                </select>
              </div>

              <div>
                <label htmlFor="task-reminder-sound" className="block text-xs text-gray-400 mb-1">
                  Sound
                </label>
                <select
                  id="task-reminder-sound"
                  value={reminderSound}
                  onChange={(e) =>
                    setReminderSound(e.target.value as NotificationSoundType | "none")
                  }
                  className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500/50"
                >
                  <option value="default">Default</option>
                  <option value="gentle">Gentle</option>
                  <option value="urgent">Urgent</option>
                  <option value="chime">Chime</option>
                  <option value="none">Silent</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>

          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Creating..." : "Save Task"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
