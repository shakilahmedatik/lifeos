import type { Task, TaskCategory, TaskRecurrence, TaskSubtask } from "@lifeos/contracts";
import { useEffect, useState } from "react";
import Button from "../../components/ui/Button.js";
import Card from "../../components/ui/Card.js";
import { PlusIcon, XIcon } from "../../components/ui/icons.js";
import { useLearningResources } from "../skills/useLearningResources.js";
import { useWorkouts } from "../workouts/useWorkouts.js";
import { addMinutesToTime } from "./TaskForm.js";
import { computeDurationMins } from "./TaskList.js";

interface TaskEditModalProps {
  task: Task;
  onSave: (id: string, patch: Partial<Task>) => Promise<void>;
  onClose: () => void;
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

export default function TaskEditModal({ task, onSave, onClose }: TaskEditModalProps) {
  const initialDuration = computeDurationMins(task.startTime, task.endTime);
  const matchedPreset = DURATION_OPTIONS.some((opt) => opt.value === initialDuration)
    ? initialDuration
    : -1;

  const [title, setTitle] = useState(task.title);
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [referenceId, setReferenceId] = useState<string>(task.referenceId ?? "");
  const [date, setDate] = useState(task.date);
  const [startTime, setStartTime] = useState(task.startTime);
  const [endTime, setEndTime] = useState(task.endTime);
  const [durationPreset, setDurationPreset] = useState<number>(matchedPreset);
  const [recurrence, setRecurrence] = useState<TaskRecurrence>(task.recurrence ?? "none");
  const [notes, setNotes] = useState(task.notes ?? "");

  const { workouts } = useWorkouts();
  const { resources: learningResources } = useLearningResources();

  // Subtasks
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>(task.subtasks ?? []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Notification Reminder Config
  const [enableReminder, setEnableReminder] = useState<boolean>(
    Boolean(task.reminderMinutesBefore),
  );
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number>(
    task.reminderMinutesBefore ?? 15,
  );
  const [reminderSound, setReminderSound] = useState<string>(
    task.reminderSilent ? "none" : "default",
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (durationPreset !== -1) {
      setEndTime(addMinutesToTime(startTime, durationPreset));
    }
  }, [startTime, durationPreset]);

  const isOvernight = startTime > endTime;

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

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st)),
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((st) => st.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (startTime === endTime) {
      setError("Start time cannot be equal to end time");
      return;
    }

    try {
      setSubmitting(true);
      await onSave(task.id, {
        title: title.trim(),
        category,
        date,
        startTime,
        endTime,
        recurrence,
        referenceId: referenceId || undefined,
        notes: notes.trim() || undefined,
        subtasks,
        reminderMinutesBefore: enableReminder ? reminderMinutesBefore : null,
        reminderSilent: enableReminder ? reminderSound === "none" : false,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-lg border-blue-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-gray-700/50 mb-4">
          <h2 className="text-lg font-bold text-gray-100">Edit Task</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit modal"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800"
          >
            <XIcon size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-800 rounded-lg text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-task-title"
              className="block text-xs font-medium text-gray-400 mb-1"
            >
              Title *
            </label>
            <input
              id="edit-task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="edit-task-category"
                className="block text-xs font-medium text-gray-400 mb-1"
              >
                Category
              </label>
              <select
                id="edit-task-category"
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
              <label
                htmlFor="edit-task-date"
                className="block text-xs font-medium text-gray-400 mb-1"
              >
                Date
              </label>
              <input
                id="edit-task-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div>
              <label
                htmlFor="edit-task-recurrence"
                className="block text-xs font-medium text-gray-400 mb-1"
              >
                Repeat
              </label>
              <select
                id="edit-task-recurrence"
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
              <label
                htmlFor="edit-task-workout"
                className="block text-xs font-medium text-gray-400 mb-1"
              >
                Select Workout Plan
              </label>
              <select
                id="edit-task-workout"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              >
                <option value="">No linked workout</option>
                {workouts.map((w) => (
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
                htmlFor="edit-task-learning-resource"
                className="block text-xs font-medium text-gray-400 mb-1"
              >
                Select Learning Resource (Optional)
              </label>
              <select
                id="edit-task-learning-resource"
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

          <div className="space-y-2 bg-gray-800/40 p-3 rounded-xl border border-gray-700/40">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="edit-start-time"
                  className="block text-xs font-medium text-gray-400 mb-1"
                >
                  Start Time
                </label>
                <input
                  id="edit-start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-end-time"
                  className="block text-xs font-medium text-gray-400 mb-1"
                >
                  End Time
                </label>
                <input
                  id="edit-end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setDurationPreset(-1);
                  }}
                  className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-gray-400 mb-1.5">
                Duration Presets:
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
                    className={`px-2 py-0.5 text-xs font-medium rounded-md border transition-colors ${
                      durationPreset === opt.value
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isOvernight && (
            <div className="text-xs text-amber-400 flex items-center gap-1.5 bg-amber-500/10 p-2 rounded border border-amber-500/20">
              <span>🌙</span>
              <span>Spans overnight (ends next morning at {endTime})</span>
            </div>
          )}

          {/* Subtasks Checklist Editor */}
          <div className="space-y-2 bg-gray-800/40 p-3 rounded-xl border border-gray-700/40">
            <label className="block text-xs font-medium text-gray-300">
              Sub-tasks / Todos Checklist ({subtasks.filter((s) => s.completed).length}/
              {subtasks.length})
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add a subtask item..."
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
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30 border border-gray-600/30 text-xs text-gray-200"
                  >
                    <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(st.id)}
                        className="rounded bg-gray-700 border-gray-600 accent-blue-500"
                      />
                      <span
                        className={`truncate ${st.completed ? "line-through text-gray-500" : ""}`}
                      >
                        {st.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      aria-label={`Remove subtask ${st.title}`}
                      className="text-gray-400 hover:text-red-400 p-1 ml-2"
                    >
                      <XIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="edit-notes" className="block text-xs font-medium text-gray-400 mb-1">
              Notes
            </label>
            <textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          {/* Notification Settings Section */}
          <div className="space-y-2 pt-1 border-t border-gray-700/40">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={enableReminder}
                onChange={(e) => setEnableReminder(e.target.checked)}
                className="rounded bg-gray-700 border-gray-600 accent-blue-500"
              />
              <span>Set Notification Reminder</span>
            </label>

            {enableReminder && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div>
                  <label
                    htmlFor="edit-reminder-timing"
                    className="block text-xs text-gray-400 mb-1"
                  >
                    Timing
                  </label>
                  <select
                    id="edit-reminder-timing"
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
                  <label htmlFor="edit-reminder-sound" className="block text-xs text-gray-400 mb-1">
                    Sound
                  </label>
                  <select
                    id="edit-reminder-sound"
                    value={reminderSound}
                    onChange={(e) => setReminderSound(e.target.value)}
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

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-700/50">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>

            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
