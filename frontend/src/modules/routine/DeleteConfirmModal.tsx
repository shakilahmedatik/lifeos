import Button from "../../components/ui/Button.js";
import Modal from "../../components/ui/Modal.js";

interface DeleteConfirmModalProps {
  taskTitle: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  taskTitle,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <Modal open={true} onClose={onCancel} title="Delete Task?" size="sm">
      <p className="text-sm text-gray-300 mb-4">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-gray-100">"{taskTitle}"</span>? This action cannot be
        undone.
      </p>

      <div className="flex items-center justify-end gap-3 pt-2 mt-4 border-t border-gray-700/50">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>

        <Button variant="danger" size="sm" onClick={onConfirm}>
          Delete Task
        </Button>
      </div>
    </Modal>
  );
}
