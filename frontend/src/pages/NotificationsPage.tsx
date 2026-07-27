import type { NewNotificationInput, Task } from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts";
import { useCallback, useEffect, useState } from "react";
import { useAppToast } from "../components/Toast.js";
import Badge from "../components/ui/Badge.js";
import Button from "../components/ui/Button.js";
import Card, { CardHeader, CardTitle } from "../components/ui/Card.js";
import { BellIcon, PlusIcon, RefreshCwIcon } from "../components/ui/icons.js";
import Modal from "../components/ui/Modal.js";
import { api } from "../lib/api.js";

type Reminder = {
  taskId: Task["id"];
  minutesBefore: NonNullable<Task["reminderMinutesBefore"]>;
  sound: "none" | "default";
};

export default function NotificationsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [minutesBefore, setMinutesBefore] = useState(15);
  const [sound, setSound] = useState("default");
  const toast = useAppToast();

  const fetchTasks = useCallback(async () => {
    try {
      const today = getClientDateString();
      const data = await api.getTasks(today);
      setTasks(data);
      const r: Reminder[] = [];
      for (const t of data) {
        if (t.reminderMinutesBefore) {
          r.push({
            taskId: t.id,
            minutesBefore: t.reminderMinutesBefore,
            sound: t.reminderSilent ? "none" : "default",
          });
        }
      }
      setReminders(r);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSetReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    const task = tasks.find((t) => t.id === selectedTask);
    if (!task) return;
    try {
      await api.updateTask(selectedTask, {
        reminderMinutesBefore: minutesBefore,
        reminderSilent: sound === "none",
      });
      if (sound !== "none") {
        const [y, m, d] = task.date.split("-").map(Number);
        const [hh, mm] = task.startTime.split(":").map(Number);
        const dt = new Date(y, m - 1, d, hh, mm);
        dt.setMinutes(dt.getMinutes() - minutesBefore);
        const input: NewNotificationInput = {
          taskId: selectedTask,
          reminderTime: dt.toISOString(),
          soundType: sound as NewNotificationInput["soundType"],
        };
        await api.createNotification(input);
      }
      setShowForm(false);
      fetchTasks();
    } catch {
      toast.error("Failed to set reminder");
    }
  };

  const handleRemoveReminder = async (taskId: string) => {
    try {
      await api.deleteNotificationsByTaskId(taskId);
      await api.updateTask(taskId, {
        reminderMinutesBefore: null,
        reminderSilent: true,
      });
      fetchTasks();
    } catch {
      toast.error("Failed to remove reminder");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage reminders and notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCwIcon size={14} />}
            onClick={fetchTasks}
          />
          <Button size="sm" icon={<PlusIcon size={14} />} onClick={() => setShowForm(true)}>
            Add Reminder
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                <BellIcon size={16} className="text-blue-400" />
                <span>Active Reminders</span>
              </CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {reminders.length === 0 ? (
                <p className="text-gray-500 text-sm">No active reminders</p>
              ) : (
                reminders.map((r) => {
                  const task = tasks.find((t) => t.id === r.taskId);
                  if (!task) return null;
                  return (
                    <div
                      key={r.taskId}
                      className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-200">{task.title}</p>
                        <p className="text-xs text-gray-500">
                          {r.minutesBefore} min before · Sound: {r.sound}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveReminder(r.taskId)}
                        className="px-2 py-1 rounded text-xs text-gray-500 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Tasks</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-sm">No tasks today</p>
              ) : (
                tasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          t.status === "done"
                            ? "success"
                            : t.status === "in_progress"
                              ? "info"
                              : "default"
                        }
                        size="sm"
                      >
                        {t.status}
                      </Badge>
                      <span className="text-sm text-gray-200">{t.title}</span>
                    </div>
                    <span className="text-xs text-gray-500">{t.startTime}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Set Reminder">
        <form onSubmit={handleSetReminder} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Task</label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              required
            >
              <option value="">Select task</option>
              {tasks
                .filter((t) => t.status !== "done")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Remind me before</label>
            <select
              value={minutesBefore}
              onChange={(e) => setMinutesBefore(Number(e.target.value))}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Sound</label>
            <select
              value={sound}
              onChange={(e) => setSound(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value="default">Default</option>
              <option value="gentle">Gentle</option>
              <option value="urgent">Urgent</option>
              <option value="chime">Chime</option>
              <option value="none">Silent</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit">Set Reminder</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
