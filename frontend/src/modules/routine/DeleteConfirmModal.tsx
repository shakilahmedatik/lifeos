import Button from "../../components/ui/Button.js";
import Card from "../../components/ui/Card.js";
import { XIcon } from "../../components/ui/icons.js";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-sm border-red-500/30 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-gray-700/50 mb-3">
          <h3 className="text-base font-bold text-gray-100">Delete Task?</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close delete dialog"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800"
          >
            <XIcon size={16} />
          </button>
        </div>

        <p className="text-sm text-gray-300 mb-4">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-100">"{taskTitle}"</span>? This action cannot be
          undone.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>

          <Button variant="danger" size="sm" onClick={onConfirm}>
            Delete Task
          </Button>
        </div>
      </Card>
    </div>
  );
}
