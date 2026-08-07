import type { NewTaskInput } from "@lifeos/contracts";
import Modal from "../../components/ui/Modal.js";
import TaskForm from "./TaskForm.js";

interface TaskCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NewTaskInput) => Promise<void>;
  defaultDate: string;
}

export default function TaskCreateModal({
  open,
  onClose,
  onSubmit,
  defaultDate,
}: TaskCreateModalProps) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Create New Task / Routine" size="md">
      <TaskForm
        onSubmit={async (input) => {
          await onSubmit(input);
          onClose();
        }}
        onCancel={onClose}
        defaultDate={defaultDate}
      />
    </Modal>
  );
}
