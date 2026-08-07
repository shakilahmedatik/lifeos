import type { Task, TaskCategory, TaskRecurrence, TaskSubtask } from "@lifeos/contracts";
import { Plus as PlusIcon, X as XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../../components/ui/Button.js";
import { ErrorBanner } from "../../components/ui/ErrorBanner.js";
import { Input } from "../../components/ui/Input.js";
import Modal from "../../components/ui/Modal.js";
import ModalFooter from "../../components/ui/ModalFooter.js";
import { Select } from "../../components/ui/Select.js";
import { useLearningResources } from "../skills/hooks/useLearningResources.js";
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
    <Modal open={true} onClose={onClose} title="Edit Task" size="md">
      <div className="space-y-4">
        {error && <ErrorBanner message={error} className="mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="edit-task-title"
            label="Title *"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              id="edit-task-category"
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              options={[
                { value: "general", label: "General" },
                { value: "work", label: "Work" },
                { value: "workout", label: "Workout" },
                { value: "learning", label: "Learning" },
                { value: "habit", label: "Habit" },
                { value: "personal", label: "Personal" },
              ]}
            />

            <Input
              id="edit-task-date"
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <Select
              id="edit-task-recurrence"
              label="Repeat"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as TaskRecurrence)}
              options={[
                { value: "none", label: "No Repeat" },
                { value: "daily", label: "Daily" },
                { value: "weekdays", label: "Weekdays (Sun–Thu BD)" },
                { value: "weekly", label: "Weekly" },
              ]}
            />
          </div>

          {category === "workout" && (
            <div>
              <label
                htmlFor="edit-task-workout"
                className="block text-xs font-medium text-secondary mb-1"
              >
                Select Workout Plan
              </label>
              <select
                id="edit-task-workout"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                className="w-full bg-card-hover border border-border-subtle text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
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
                className="block text-xs font-medium text-secondary mb-1"
              >
                Select Learning Resource (Optional)
              </label>
              <select
                id="edit-task-learning-resource"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                className="w-full bg-card-hover border border-border-subtle text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
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

          <div className="space-y-2 bg-surface-elevated p-3 rounded-xl border border-border">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="edit-start-time"
                  className="block text-xs font-medium text-secondary mb-1"
                >
                  Start Time
                </label>
                <input
                  id="edit-start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-card-hover border border-border-subtle text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-end-time"
                  className="block text-xs font-medium text-secondary mb-1"
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
                  className="w-full bg-card-hover border border-border-subtle text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-secondary mb-1.5">
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
                        : "bg-card-hover border-border-subtle text-primary hover:bg-card-hover"
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
          <div className="space-y-2 bg-surface-elevated p-3 rounded-xl border border-border">
            <label className="block text-xs font-medium text-primary">
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
                className="flex-1 bg-card-hover border border-border-subtle text-primary rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
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
                    className="flex items-center justify-between p-2 rounded-lg bg-card-hover border border-border-subtle text-xs text-primary"
                  >
                    <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(st.id)}
                        className="rounded bg-card-hover border-border-subtle accent-blue-500"
                      />
                      <span className={`truncate ${st.completed ? "line-through text-muted" : ""}`}>
                        {st.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      aria-label={`Remove subtask ${st.title}`}
                      className="text-secondary hover:text-red-400 p-1 ml-2"
                    >
                      <XIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="edit-notes" className="block text-xs font-medium text-secondary mb-1">
              Notes
            </label>
            <textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-card-hover border border-border-subtle text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          {/* Notification Settings Section */}
          <div className="space-y-2 pt-1 border-t border-border">
            <label className="flex items-center gap-2 text-sm text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={enableReminder}
                onChange={(e) => setEnableReminder(e.target.checked)}
                className="rounded bg-card-hover border-border-subtle accent-blue-500"
              />
              <span>Set Notification Reminder</span>
            </label>

            {enableReminder && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div>
                  <label
                    htmlFor="edit-reminder-timing"
                    className="block text-xs text-secondary mb-1"
                  >
                    Timing
                  </label>
                  <select
                    id="edit-reminder-timing"
                    value={reminderMinutesBefore}
                    onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                    className="w-full bg-card-hover border border-border-subtle text-primary rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500/50"
                  >
                    <option value={5}>5 min before</option>
                    <option value={10}>10 min before</option>
                    <option value={15}>15 min before</option>
                    <option value={30}>30 min before</option>
                    <option value={60}>1 hour before</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-reminder-sound"
                    className="block text-xs text-secondary mb-1"
                  >
                    Sound
                  </label>
                  <select
                    id="edit-reminder-sound"
                    value={reminderSound}
                    onChange={(e) => setReminderSound(e.target.value)}
                    className="w-full bg-card-hover border border-border-subtle text-primary rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500/50"
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

          <ModalFooter>
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>

            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </ModalFooter>
        </form>
      </div>
    </Modal>
  );
}
