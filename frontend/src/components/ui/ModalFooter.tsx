import type { ReactNode } from "react";
import Button from "./Button.js";
import { cn } from "../../lib/utils.js";

interface ModalFooterProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  cancelText?: string;
  submitText?: string;
  submitIcon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

export default function ModalFooter({
  onCancel,
  onSubmit,
  cancelText = "Cancel",
  submitText = "Save",
  submitIcon,
  loading = false,
  disabled = false,
  className,
  children,
}: ModalFooterProps) {
  return (
    <div className={cn("flex justify-end gap-2 pt-4 mt-4 border-t border-border", className)}>
      {children ? (
        children
      ) : (
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          {onSubmit && (
            <Button
              variant="primary"
              onClick={onSubmit}
              loading={loading}
              disabled={disabled}
              icon={submitIcon}
            >
              {submitText}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
