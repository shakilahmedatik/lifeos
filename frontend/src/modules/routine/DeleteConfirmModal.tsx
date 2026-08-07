import Button from "../../components/ui/Button.js";
import Modal from "../../components/ui/Modal.js";
import ModalFooter from "../../components/ui/ModalFooter.js";

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
      <p className="text-sm text-primary mb-4">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-primary">"{taskTitle}"</span>? This action cannot be
        undone.
      </p>

      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>

        <Button variant="danger" size="sm" onClick={onConfirm}>
          Delete Task
        </Button>
      </ModalFooter>
    </Modal>
  );
}
