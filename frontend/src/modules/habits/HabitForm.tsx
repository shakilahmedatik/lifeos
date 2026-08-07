import type { HabitDefinition, NewHabitDefinitionInput } from "@lifeos/contracts";
import { useState } from "react";
import Button from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";

interface HabitFormProps {
  habit?: HabitDefinition;
  onSubmit: (input: NewHabitDefinitionInput) => void;
  onCancel: () => void;
}

export default function HabitForm({ habit, onSubmit, onCancel }: HabitFormProps) {
  const [name, setName] = useState(habit?.name ?? "");
  const [category, setCategory] = useState<HabitDefinition["category"]>(
    habit?.category ?? "general",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      type: habit?.type ?? "boolean",
      category,
      config: habit?.config ?? { type: "boolean" },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 bg-surface rounded-lg border border-border"
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
          id="habit-category"
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as HabitDefinition["category"])}
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
