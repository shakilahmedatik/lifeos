import type { NewReminderInput, Reminder } from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts/date-utils";
import { Bell, Calendar, CheckCircle2, Plus } from "lucide-react";
import { useState } from "react";
import Button from "../../../components/ui/Button.js";
import { EmptyState } from "../../../components/ui/EmptyState.js";
import Modal from "../../../components/ui/Modal.js";
import { Select } from "../../../components/ui/Select.js";
import { DashboardPanel } from "../components/DashboardPanel.js";

interface RemindersWidgetProps {
  reminders: Reminder[];
  onComplete: (id: string) => void;
  onAdd: (input: NewReminderInput) => Promise<void> | void;
}

function getCurrentTimeStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function RemindersWidget({ reminders, onComplete, onAdd }: RemindersWidgetProps) {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState(getCurrentTimeStr);
  const [date, setDate] = useState(getClientDateString);
  const [kind, setKind] = useState<"reminder" | "event">("reminder");
  const [submitting, setSubmitting] = useState(false);

  const openModal = () => {
    setTime(getCurrentTimeStr());
    setDate(getClientDateString());
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    try {
      setSubmitting(true);
      await onAdd({ title: title.trim(), time, date: date || null, kind });
      setTitle("");
      setShowModal(false);
    } catch {
      // Keep modal open so user input is preserved on error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DashboardPanel
        title="Reminders & Events"
        subtitle="today"
        action={
          <button
            type="button"
            onClick={openModal}
            className="p-1 rounded-md text-muted hover:text-primary hover:bg-card-hover transition-colors"
            title="Add Reminder or Event"
          >
            <Plus size={14} />
          </button>
        }
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex flex-col overflow-y-auto divide-y divide-border/40">
            {reminders.length === 0 ? (
              <EmptyState title="No upcoming reminders" className="py-6" />
            ) : (
              reminders.slice(0, 4).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2 px-1 hover:bg-card-hover/30 rounded transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[11px] text-muted w-10 shrink-0">{r.time}</span>
                    {r.kind === "reminder" ? (
                      <Bell size={13} className="text-rose-400 shrink-0" />
                    ) : (
                      <Calendar size={13} className="text-indigo-400 shrink-0" />
                    )}
                    <span className="text-xs text-primary truncate">{r.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onComplete(r.id)}
                    className="text-muted hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                    title="Mark done"
                  >
                    <CheckCircle2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </DashboardPanel>

      {/* New Standalone Reminder/Event Modal matching NotificationsPage */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Reminder or Event">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. John's Birthday, Standup call, Take vitamins"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Select
                label="Type"
                value={kind}
                onChange={(e) => setKind(e.target.value as "reminder" | "event")}
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
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm text-primary font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Date (Optional)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm text-primary font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
