import { useEffect, useState } from "react";

interface NotificationToastProps {
  notification: {
    id: string;
    taskTitle: string;
    reminderTime: string;
    soundType: string;
  } | null;
  onDismiss: () => void;
}

export function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  if (!notification) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-4 right-4 z-50 bg-gray-900/90 backdrop-blur-md border border-blue-500/50 shadow-2xl rounded-xl p-4 max-w-sm transform transition-all duration-300 ${
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-1 bg-blue-500/20 rounded-lg">
          <svg
            className="h-5 w-5 text-blue-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <title>Notification</title>
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-100 truncate">{notification.taskTitle}</p>
          <p className="text-xs text-gray-400 mt-0.5">Reminder for task</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="text-gray-400 hover:text-gray-200 p-1 transition-colors"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <title>Close</title>
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
