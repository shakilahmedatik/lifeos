import type { Habit, NewHabitInput } from "@lifeos/contracts";
import { useState } from "react";
import Button from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";

interface HabitFormProps {
  habit?: Habit;
  onSubmit: (input: NewHabitInput) => void;
  onCancel: () => void;
}

export default function HabitForm({ habit, onSubmit, onCancel }: HabitFormProps) {
  const [name, setName] = useState(habit?.name ?? "");
  const [frequency, setFrequency] = useState<Habit["frequency"]>(habit?.frequency ?? "daily");
  const [category, setCategory] = useState<Habit["category"]>(habit?.category ?? "general");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, frequency, category });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 bg-white rounded-lg border border-gray-200"
    >
      <div>
        <Input
          id="habit-name"
          label="Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Select
          id="habit-frequency"
          label="Frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as Habit["frequency"])}
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
          ]}
        />
      </div>
      <div>
        <Select
          id="habit-category"
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Habit["category"])}
          options={[
            { value: "health", label: "Health" },
            { value: "learning", label: "Learning" },
            { value: "productivity", label: "Productivity" },
            { value: "mindfulness", label: "Mindfulness" },
            { value: "fitness", label: "Fitness" },
            { value: "general", label: "General" },
          ]}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">{habit ? "Update" : "Create"}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
