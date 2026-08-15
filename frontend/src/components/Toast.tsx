import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "../lib/utils.js";

type ToastType = "error" | "success" | "info" | "warning";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastActions {
  show: (message: string, type?: ToastType) => void;
  error: (message: string) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
}

let toastId = 0;

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const error = useCallback((message: string) => show(message, "error"), [show]);
  const success = useCallback((message: string) => show(message, "success"), [show]);
  const warning = useCallback((message: string) => show(message, "warning"), [show]);

  return { toasts, show, error, success, warning };
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-24 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto px-4 py-3 rounded-xl text-sm font-medium shadow-lg border animate-fade-in",
            toast.type === "error"
              ? "bg-danger/15 border-danger/30 text-danger"
              : toast.type === "success"
                ? "bg-success/15 border-success/30 text-success"
                : toast.type === "warning"
                  ? "bg-warning/15 border-warning/30 text-warning"
                  : "bg-card border-border text-primary",
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

const ToastContext = createContext<ToastActions | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, show, error, success, warning } = useToast();
  const actions = useMemo(
    () => ({ show, error, success, warning }),
    [show, error, success, warning],
  );

  return (
    <ToastContext.Provider value={actions}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useAppToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      show: () => {},
      error: () => {},
      success: () => {},
      warning: () => {},
    };
  }
  return ctx;
}
