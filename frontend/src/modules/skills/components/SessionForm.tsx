import { useState } from "react";
import Button from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import { Select } from "../../../components/ui/Select.js";
import type { LearningLog, LearningResource, NewLearningLogInput } from "../types.js";

interface SessionFormProps {
  log?: LearningLog;
  resources: LearningResource[];
  initialResourceId?: string;
  initialMinutesSpent?: number;
  onSubmit: (input: NewLearningLogInput) => void;
  onCancel: () => void;
}

export default function SessionForm({
  log,
  resources,
  initialResourceId,
  initialMinutesSpent,
  onSubmit,
  onCancel,
}: SessionFormProps) {
  const [date, setDate] = useState(log?.date ?? new Date().toISOString().split("T")[0]);
  const [minutesSpent, setMinutesSpent] = useState(
    log?.minutesSpent?.toString() ?? initialMinutesSpent?.toString() ?? "30",
  );
  const [resourceId, setResourceId] = useState(
    log?.resourceId ?? initialResourceId ?? (resources.length > 0 ? resources[0].id : ""),
  );
  const [unitsCompleted, setUnitsCompleted] = useState(log?.unitsCompleted?.toString() ?? "");
  const [notes, setNotes] = useState(log?.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date,
      minutesSpent: Number(minutesSpent),
      resourceId,
      unitsCompleted: unitsCompleted !== "" ? Number(unitsCompleted) : undefined,
      notes: notes.trim() || undefined,
    });
  };

  const resourceOptions =
    resources.length === 0
      ? [{ value: "", label: "No resources available", disabled: true }]
      : resources.map((r) => ({ value: r.id, label: r.title }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <Input
          label="Minutes"
          type="number"
          min="1"
          value={minutesSpent}
          onChange={(e) => setMinutesSpent(e.target.value)}
          required
        />
      </div>
      <Select
        label="Learning Resource"
        value={resourceId}
        onChange={(e) => setResourceId(e.target.value)}
        options={resourceOptions}
        required
      />
      <Input
        label="Units Completed"
        type="number"
        min="0"
        step="0.5"
        value={unitsCompleted}
        onChange={(e) => setUnitsCompleted(e.target.value)}
        placeholder="Optional"
      />
      <div>
        <label htmlFor="log-notes" className="block text-sm font-medium text-secondary mb-1">
          Notes
        </label>
        <textarea
          id="log-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-input/40 border border-border text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 placeholder-muted resize-none transition-colors"
          rows={2}
          placeholder="Optional notes"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {log ? "Update" : "Log Session"}
        </Button>
      </div>
    </form>
  );
}
