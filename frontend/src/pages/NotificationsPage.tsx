import type { NewNotificationInput, NewReminderInput, Reminder, Task } from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts";
import {
  Bell as BellIcon,
  Calendar as CalendarIcon,
  CheckCircle2,
  Plus as PlusIcon,
  RefreshCw as RefreshCwIcon,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAppToast } from "../components/Toast.js";
import Badge from "../components/ui/Badge.js";
import Button from "../components/ui/Button.js";
import Card, { CardHeader, CardTitle } from "../components/ui/Card.js";
import { EmptyState } from "../components/ui/EmptyState.js";
import Modal from "../components/ui/Modal.js";
import ModalFooter from "../components/ui/ModalFooter.js";
import { OnlineOnlyBanner } from "../components/ui/OnlineOnlyBanner.js";
import { PageHeader } from "../components/ui/PageHeader.js";
import { Select } from "../components/ui/Select.js";
import { api } from "../lib/api.js";

type TaskReminder = {
  taskId: Task["id"];
  minutesBefore: NonNullable<Task["reminderMinutesBefore"]>;
  sound: string;
};

function getCurrentTimeStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export default function NotificationsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [taskReminders, setTaskReminders] = useState<TaskReminder[]>([]);

  // Task reminder form state
  const [selectedTask, setSelectedTask] = useState("");
  const [minutesBefore, setMinutesBefore] = useState(15);
  const [sound, setSound] = useState("default");

  // Standalone reminder form state
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderTime, setReminderTime] = useState(getCurrentTimeStr);
  const [reminderDate, setReminderDate] = useState(getClientDateString);
  const [reminderKind, setReminderKind] = useState<"reminder" | "event">("reminder");

  const openReminderModal = () => {
    setReminderTime(getCurrentTimeStr());
    setReminderDate(getClientDateString());
    setShowReminderForm(true);
  };

  const toast = useAppToast();

  const fetchData = useCallback(async () => {
    try {
      const today = getClientDateString();
      const [tasksData, remindersData, notificationsData] = await Promise.all([
        api.getTasks(today),
        api.getReminders(),
        api.getNotifications().catch(() => []),
      ]);
      setTasks(tasksData);
      setReminders(remindersData);

      const r: TaskReminder[] = [];
      for (const t of tasksData) {
        if (t.reminderMinutesBefore) {
          const matchingNotif = notificationsData.find((n) => n.taskId === t.id);
          r.push({
            taskId: t.id,
            minutesBefore: t.reminderMinutesBefore,
            sound: matchingNotif?.soundType || (t.reminderSilent ? "none" : "default"),
          });
        }
      }
      setTaskReminders(r);
    } catch {
      toast.error("Failed to load reminders & alerts");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSetTaskReminder = async (e: React.FormEvent) => {
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
        let reminderDateObj: Date;
        if (task.date && task.startTime) {
          const [y, m, d] = task.date.split("-").map(Number);
          const [hh, mm] = task.startTime.split(":").map(Number);
          reminderDateObj = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
        } else if (task.date) {
          reminderDateObj = new Date(task.date);
        } else {
          reminderDateObj = new Date();
        }

        if (Number.isNaN(reminderDateObj.getTime())) {
          reminderDateObj = new Date();
        }

        reminderDateObj.setMinutes(reminderDateObj.getMinutes() - minutesBefore);

        const input: NewNotificationInput = {
          taskId: selectedTask,
          reminderTime: reminderDateObj.toISOString(),
          soundType: sound as NewNotificationInput["soundType"],
        };
        await api.createNotification(input);
      }
      setShowTaskForm(false);
      fetchData();
      toast.success("Task reminder set");
    } catch {
      toast.error("Failed to set task reminder");
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim()) return;
    try {
      const input: NewReminderInput = {
        title: reminderTitle.trim(),
        time: reminderTime,
        date: reminderDate || null,
        kind: reminderKind,
      };
      await api.createReminder(input);
      setShowReminderForm(false);
      setReminderTitle("");
      setReminderDate("");
      fetchData();
      toast.success("Item created successfully");
    } catch {
      toast.error("Failed to create item");
    }
  };

  const handleRemoveTaskReminder = async (taskId: string) => {
    try {
      await api.deleteNotificationsByTaskId(taskId);
      await api.updateTask(taskId, {
        reminderMinutesBefore: null,
        reminderSilent: true,
      });
      fetchData();
    } catch {
      toast.error("Failed to remove reminder");
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await api.deleteReminder(id);
      fetchData();
      toast.success("Reminder deleted");
    } catch {
      toast.error("Failed to delete reminder");
    }
  };

  const handleToggleReminderDone = async (id: string, currentStatus: boolean) => {
    try {
      await api.updateReminder(id, { completed: !currentStatus });
      fetchData();
    } catch {
      toast.error("Failed to update reminder");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reminders & Alerts"
        description="Manage your standalone reminders, events, and task notifications"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCwIcon size={14} />}
              onClick={fetchData}
            />
            <Button size="sm" icon={<PlusIcon size={14} />} onClick={openReminderModal}>
              New Reminder
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<PlusIcon size={14} />}
              onClick={() => setShowTaskForm(true)}
            >
              Task Alert
            </Button>
          </div>
        }
      />

      <OnlineOnlyBanner moduleName="Notifications & Real-time Alerts" />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Standalone Reminders & Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellIcon size={16} className="text-amber-400" />
                <span>Reminders & Events</span>
              </CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {reminders.length === 0 ? (
                <EmptyState title="No reminders found" />
              ) : (
                reminders.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between py-2.5 px-2 border-b border-border/50 last:border-0 hover:bg-card-solid/30 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleReminderDone(r.id, r.completed)}
                        className={`p-1 rounded-full border transition-colors ${
                          r.completed
                            ? "bg-emerald-950/60 border-emerald-700 text-emerald-400"
                            : "border-border-subtle text-muted hover:text-amber-400"
                        }`}
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${r.completed ? "line-through text-muted" : "text-primary"}`}
                          >
                            {r.title}
                          </span>
                          <Badge variant={r.kind === "reminder" ? "orange" : "purple"} size="sm">
                            {r.kind}
                          </Badge>
                        </div>
                        <p className="text-xs font-mono text-muted mt-0.5">
                          Time: {r.time} {r.date ? `· Date: ${r.date}` : "· Daily"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteReminder(r.id)}
                      className="p-1 text-muted hover:text-red-400 transition-colors"
                      title="Delete item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Task Notifications */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon size={16} className="text-blue-400" />
                  <span>Task Alerts</span>
                </CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {taskReminders.length === 0 ? (
                  <EmptyState title="No active task alerts" />
                ) : (
                  taskReminders.map((r) => {
                    const task = tasks.find((t) => t.id === r.taskId);
                    if (!task) return null;
                    return (
                      <div
                        key={r.taskId}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-primary">{task.title}</p>
                          <p className="text-xs text-muted">
                            {r.minutesBefore} min before · Sound: {r.sound}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTaskReminder(r.taskId)}
                          className="px-2 py-1 rounded text-xs text-muted hover:text-red-400 hover:bg-red-900/30 transition-colors"
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
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <EmptyState title="No tasks scheduled today" />
                ) : (
                  tasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
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
                        <span className="text-sm text-primary">{t.title}</span>
                      </div>
                      <span className="text-xs text-muted font-mono">{t.startTime}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* New Standalone Reminder/Event Modal */}
      <Modal
        open={showReminderForm}
        onClose={() => setShowReminderForm(false)}
        title="New Reminder or Event"
      >
        <form onSubmit={handleCreateReminder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. John's Birthday, Standup call, Take vitamins"
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
              className="w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Select
                label="Type"
                value={reminderKind}
                onChange={(e) => setReminderKind(e.target.value as "reminder" | "event")}
                options={[
                  { value: "reminder", label: "Reminder" },
                  { value: "event", label: "Event" },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Time</label>
              <input
                type="time"
                required
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm text-primary font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Date (Optional)
              </label>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm text-primary font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <ModalFooter>
            <Button variant="secondary" type="button" onClick={() => setShowReminderForm(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Task Alert Modal */}
      <Modal open={showTaskForm} onClose={() => setShowTaskForm(false)} title="Set Task Alert">
        <form onSubmit={handleSetTaskReminder} className="space-y-4">
          <div>
            <Select
              label="Task"
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              required
              options={[
                { value: "", label: "Select task" },
                ...tasks
                  .filter((t) => t.status !== "done")
                  .map((t) => ({ value: t.id, label: t.title })),
              ]}
            />
          </div>
          <div>
            <Select
              label="Remind me before"
              value={minutesBefore.toString()}
              onChange={(e) => setMinutesBefore(Number(e.target.value))}
              options={[
                { value: "5", label: "5 minutes" },
                { value: "10", label: "10 minutes" },
                { value: "15", label: "15 minutes" },
                { value: "30", label: "30 minutes" },
                { value: "60", label: "1 hour" },
              ]}
            />
          </div>
          <div>
            <Select
              label="Sound"
              value={sound}
              onChange={(e) => setSound(e.target.value)}
              options={[
                { value: "default", label: "Default" },
                { value: "gentle", label: "Gentle" },
                { value: "urgent", label: "Urgent" },
                { value: "chime", label: "Chime" },
                { value: "none", label: "Silent" },
              ]}
            />
          </div>
          <ModalFooter>
            <Button variant="secondary" type="button" onClick={() => setShowTaskForm(false)}>
              Cancel
            </Button>
            <Button type="submit">Set Alert</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
