import { useState } from "react";
import Button from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import Modal from "../../../components/ui/Modal.js";
import { Select } from "../../../components/ui/Select.js";
import type {
  LearningResource,
  LearningResourceType,
  LearningUnit,
  NewLearningResourceInput,
  SkillArea,
} from "../types.js";

interface CourseFormProps {
  resource?: LearningResource;
  areas: SkillArea[];
  onSubmit: (input: NewLearningResourceInput) => void;
  onCancel: () => void;
}

export default function CourseForm({ resource, areas, onSubmit, onCancel }: CourseFormProps) {
  const [title, setTitle] = useState(resource?.title ?? "");
  const [skillAreaId, setSkillAreaId] = useState(
    resource?.skillAreaId ?? (areas.length > 0 ? areas[0].id : ""),
  );
  const [type, setType] = useState<LearningResourceType>(resource?.type ?? "course");
  const [totalUnits, setTotalUnits] = useState(resource?.totalUnits?.toString() ?? "");
  const [unit, setUnit] = useState<LearningUnit | "">(resource?.unit ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      skillAreaId,
      type,
      totalUnits: totalUnits !== "" ? Number(totalUnits) : undefined,
      unit: unit || undefined,
    });
  };

  const areaOptions =
    areas.length === 0
      ? [{ value: "", label: "No areas available", disabled: true }]
      : areas.map((a) => ({ value: a.id, label: a.name }));

  const typeOptions = [
    { value: "course", label: "Course" },
    { value: "book", label: "Book" },
    { value: "project", label: "Project" },
    { value: "article", label: "Article" },
  ];

  const unitOptions = [
    { value: "", label: "None" },
    { value: "chapters", label: "Chapters" },
    { value: "videos", label: "Videos" },
    { value: "hours", label: "Hours" },
  ];

  return (
    <Modal open={true} onClose={onCancel} title={resource ? "Edit Resource" : "Add Resource"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., React Masterclass"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Skill Area"
            value={skillAreaId}
            onChange={(e) => setSkillAreaId(e.target.value)}
            options={areaOptions}
            required
          />
          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as LearningResourceType)}
            options={typeOptions}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Total Units"
            type="number"
            min="1"
            step="0.5"
            value={totalUnits}
            onChange={(e) => setTotalUnits(e.target.value)}
            placeholder="Optional"
          />
          <Select
            label="Unit Type"
            value={unit}
            onChange={(e) => setUnit(e.target.value as LearningUnit | "")}
            options={unitOptions}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {resource ? "Update" : "Add Resource"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
