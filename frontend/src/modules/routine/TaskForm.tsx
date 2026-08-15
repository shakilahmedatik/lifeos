import type {
  NewTaskInput,
  NotificationSoundType,
  TaskCategory,
  TaskRecurrence,
  TaskSubtask,
} from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts";
import { Plus as PlusIcon, X as XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button.js";
import Card from "../../components/ui/Card.js";
import { ErrorBanner } from "../../components/ui/ErrorBanner.js";
import { Input } from "../../components/ui/Input.js";
import ModalFooter from "../../components/ui/ModalFooter.js";
import { Select } from "../../components/ui/Select.js";
import { useLearningResources } from "../skills/hooks/useLearningResources.js";
import { useWorkouts } from "../workouts/useWorkouts.js";
import { useRoutineCategories } from "./hooks/useRoutineCategories.js";

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
  const { categories: routineCategories } = useRoutineCategories();

  const categoryOptions = useMemo(() => {
    if (routineCategories && routineCategories.length > 0) {
      return routineCategories.map((c) => ({
        value: c.name,
        label: `${c.icon ? `${c.icon} ` : ""}${c.name}`,
      }));
    }
    return [
      { value: "general", label: "General" },
      { value: "routine", label: "Routine" },
      { value: "must_do", label: "Must Do" },
      { value: "work", label: "Work" },
      { value: "workout", label: "Workout" },
      { value: "learning", label: "Learning" },
      { value: "habit", label: "Habit" },
      { value: "personal", label: "Personal" },
      { value: "flex", label: "Flex" },
    ];
  }, [routineCategories]);

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
        {formError && <ErrorBanner message={formError} />}

        <Input
          id="task-title"
          label="Task Title *"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Morning Standup or Study Session"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            id="task-category"
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            options={categoryOptions}
          />

          <Select
            id="task-recurrence"
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

          <Input
            id="task-date"
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {category.toLocaleLowerCase() === "workout" && (
          <Select
            id="task-workout"
            label="Select Workout Plan *"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            required
            options={[
              { value: "", label: "Select a workout..." },
              ...workouts
                .filter((w) => (w.exerciseCount || 0) > 0)
                .map((w) => ({ value: w.id, label: w.name })),
            ]}
          />
        )}

        {category.toLocaleLowerCase() === "learning" && (
          <Select
            id="task-learning-resource"
            label="Select Learning Resource (Optional)"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            options={[
              { value: "", label: "No linked resource" },
              ...learningResources.map((r) => ({ value: r.id, label: r.title })),
            ]}
          />
        )}

        {/* Start Time & Duration Selection */}
        <div className="space-y-2 bg-surface-elevated p-3 rounded-xl border border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                id="task-start-time"
                label="Start Time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                error={isPastStart ? "⚠️ Selected time is in the past for today." : undefined}
              />
            </div>

            <div>
              <Input
                id="task-end-time"
                label={`Calculated End Time (${endTime})`}
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setDurationPreset(-1); // Switch to custom if manually changed
                }}
              />
            </div>
          </div>

          {/* Quick Duration Buttons */}
          <div>
            <span className="block text-xs font-medium text-secondary mb-1.5">
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
                      : "bg-card-hover border-border-subtle text-primary hover:bg-card-hover"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {durationPreset === -1 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-secondary">Custom Minutes:</span>
                <div className="w-24">
                  <Input
                    id="custom-duration-input"
                    type="number"
                    min={1}
                    max={1440}
                    value={customDurationMins}
                    onChange={(e) => handleCustomDurationChange(Number(e.target.value))}
                  />
                </div>
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
        <div className="space-y-2 bg-surface-elevated p-3 rounded-xl border border-border">
          <label className="block text-xs font-medium text-primary">
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
              {subtasks.map((st, idx) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-card-hover border border-border-subtle text-xs text-primary"
                >
                  <span className="truncate flex-1">
                    {idx + 1}. {st.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    aria-label={`Remove subtask ${st.title}`}
                    className="text-secondary hover:text-red-400 p-1"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="task-notes" className="block text-xs font-medium text-secondary mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="task-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add details, sub-tasks, or links..."
            rows={2}
            className="w-full bg-card-hover border border-border-subtle text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500 resize-none"
          />
        </div>

        {/* Reminder Settings */}
        <div className="space-y-2 pt-1 border-t border-border">
          <label className="flex items-center gap-2 text-sm text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={enableReminder}
              onChange={(e) => setEnableReminder(e.target.checked)}
              className="rounded bg-card-hover border-border-subtle accent-blue-500"
            />
            <span>Set Reminder Notification</span>
          </label>

          {enableReminder && (
            <div className="grid grid-cols-2 gap-3 pl-6">
              <div>
                <label htmlFor="task-reminder-timing" className="block text-xs text-secondary mb-1">
                  Timing
                </label>
                <select
                  id="task-reminder-timing"
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
                <label htmlFor="task-reminder-sound" className="block text-xs text-secondary mb-1">
                  Sound
                </label>
                <select
                  id="task-reminder-sound"
                  value={reminderSound}
                  onChange={(e) =>
                    setReminderSound(e.target.value as NotificationSoundType | "none")
                  }
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
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>

          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Creating..." : "Save Task"}
          </Button>
        </ModalFooter>
      </form>
    </Card>
  );
}
