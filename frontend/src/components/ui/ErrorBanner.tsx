import { AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils.js";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onClose?: () => void;
  className?: string;
}

export function ErrorBanner({ message, onRetry, onClose, className }: ErrorBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20",
        className,
      )}
    >
      <AlertCircle className="w-5 h-5 text-danger shrink-0" />
      <p className="text-sm text-danger flex-1">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-medium text-danger hover:text-danger/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-danger/10"
        >
          Retry
        </button>
      )}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-danger/10 text-danger hover:text-danger/80 transition-colors"
          aria-label="Close error"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default ErrorBanner;
