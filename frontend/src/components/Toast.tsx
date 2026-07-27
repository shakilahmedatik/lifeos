import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "error" | "success" | "info" | "warning";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
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
          className={`pointer-events-auto px-4 py-3 rounded-xl text-sm font-medium shadow-lg border backdrop-blur-xl animate-fade-in ${
            toast.type === "error"
              ? "bg-red-900/80 border-red-700/50 text-red-200"
              : toast.type === "success"
                ? "bg-emerald-900/80 border-emerald-700/50 text-emerald-200"
                : toast.type === "warning"
                  ? "bg-amber-900/80 border-amber-700/50 text-amber-200"
                  : "bg-gray-800/80 border-gray-700/50 text-gray-200"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

const ToastContext = createContext<ReturnType<typeof useToast> | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  return <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>;
}

export function useAppToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useAppToast must be used within ToastProvider");
  return ctx;
}
