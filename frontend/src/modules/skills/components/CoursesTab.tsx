import { Plus } from "lucide-react";
import { useState } from "react";
import Button from "../../../components/ui/Button.js";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog.js";
import Modal from "../../../components/ui/Modal.js";
import type {
  LearningResource,
  NewLearningResourceInput,
  ResourceWithProgress,
  SkillArea,
} from "../types.js";
import CourseForm from "./CourseForm.js";
import CourseList from "./CourseList.js";

interface CoursesTabProps {
  resources: LearningResource[];
  areas: SkillArea[];
  progresses: Record<string, ResourceWithProgress | null>;
  onAddResource: (input: NewLearningResourceInput) => Promise<unknown>;
  onEditResource: (id: string, input: NewLearningResourceInput) => Promise<unknown>;
  onRemoveResource: (id: string) => Promise<unknown>;
}

export function CoursesTab({
  resources,
  areas,
  progresses,
  onAddResource,
  onEditResource,
  onRemoveResource,
}: CoursesTabProps) {
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<LearningResource | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(
    null,
  );

  const handleCourseSubmit = async (input: NewLearningResourceInput) => {
    if (editingCourse) {
      await onEditResource(editingCourse.id, input);
      setEditingCourse(null);
    } else {
      await onAddResource(input);
    }
    setShowCourseForm(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;
    await onRemoveResource(deleteConfirmation.id);
    setDeleteConfirmation(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-primary">Learning Resources</h2>
        <Button
          icon={<Plus size={16} />}
          onClick={() => {
            setEditingCourse(null);
            setShowCourseForm(true);
          }}
        >
          Add Resource
        </Button>
      </div>

      <Modal
        open={showCourseForm}
        onClose={() => {
          setShowCourseForm(false);
          setEditingCourse(null);
        }}
        title={editingCourse ? "Edit Resource" : "Add Resource"}
      >
        <CourseForm
          resource={editingCourse ?? undefined}
          areas={areas}
          onSubmit={handleCourseSubmit}
          onCancel={() => {
            setShowCourseForm(false);
            setEditingCourse(null);
          }}
        />
      </Modal>

      <CourseList
        resources={resources}
        progresses={progresses}
        onEdit={(resource) => {
          setEditingCourse(resource);
          setShowCourseForm(true);
        }}
        onDelete={(id) => {
          const resource = resources.find((r) => r.id === id);
          setDeleteConfirmation({
            id,
            name: resource?.title ?? "Resource",
          });
        }}
      />

      {deleteConfirmation && (
        <ConfirmDialog
          open={!!deleteConfirmation}
          title="Delete resource"
          message={`Are you sure you want to delete "${deleteConfirmation.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirmation(null)}
        />
      )}
    </div>
  );
}

export default CoursesTab;
