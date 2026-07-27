import type { Task } from "@lifeos/contracts";
import { useState } from "react";
import { ReminderForm } from "../notifications/ReminderForm.js";
import type { SoundPreset } from "../notifications/sound-presets.js";

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (id: string, status: Task["status"]) => void;
  onSetReminder?: (taskId: string, reminderTime: string, soundType: SoundPreset) => void;
}

const statusColors: Record<Task["status"], string> = {
  planned: "bg-gray-700 text-gray-300",
  in_progress: "bg-blue-900 text-blue-300",
  done: "bg-green-900 text-green-300",
  skipped: "bg-yellow-900 text-yellow-300",
};

const categoryColors: Record<Task["category"], string> = {
  work: "border-l-blue-500",
  workout: "border-l-red-500",
  learning: "border-l-purple-500",
  habit: "border-l-orange-500",
  personal: "border-l-pink-500",
  general: "border-l-gray-500",
};

export default function TaskList({ tasks, onStatusChange, onSetReminder }: TaskListProps) {
  const [reminderTaskId, setReminderTaskId] = useState<string | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">No tasks for this day. Add one above.</div>
    );
  }

  const handleSetReminder = (taskId: string, reminderTime: string, soundType: SoundPreset) => {
    onSetReminder?.(taskId, reminderTime, soundType);
    setReminderTaskId(null);
  };

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id}>
          <div
            className={`flex items-center gap-3 p-3 rounded-lg bg-gray-800 border-l-4 ${categoryColors[task.category]}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-100 truncate">{task.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[task.status]}`}>
                  {task.status.replace("_", " ")}
                </span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {task.startTime} – {task.endTime}
                {task.notes && <span className="ml-2">• {task.notes}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onSetReminder && (
                <button
                  type="button"
                  onClick={() => setReminderTaskId(reminderTaskId === task.id ? null : task.id)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Set Reminder
                </button>
              )}
              <select
                value={task.status}
                onChange={(e) => onStatusChange(task.id, e.target.value as Task["status"])}
                className="bg-gray-700 text-gray-300 text-sm rounded px-2 py-1 border-none cursor-pointer"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>
          </div>
          {reminderTaskId === task.id && (
            <div className="mt-2">
              <ReminderForm
                taskId={task.id}
                taskTitle={task.title}
                onSubmit={(reminderTime, soundType) =>
                  handleSetReminder(task.id, reminderTime, soundType)
                }
                onCancel={() => setReminderTaskId(null)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
