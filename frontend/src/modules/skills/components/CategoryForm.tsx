import { useState } from "react";
import Button from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import type { NewSkillAreaInput, SkillArea } from "../types.js";

interface CategoryFormProps {
  category?: SkillArea;
  onSubmit: (input: NewSkillAreaInput) => void;
  onCancel: () => void;
}

export default function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Skill Area Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Programming, Design, Language"
        required
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {category ? "Update" : "Create Area"}
        </Button>
      </div>
    </form>
  );
}
