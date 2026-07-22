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
      className={`fixed top-4 right-4 bg-white border-l-4 border-blue-500 shadow-lg rounded-lg p-4 max-w-sm transform transition-transform duration-300 ${
        visible ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-blue-500"
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
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">{notification.taskTitle}</p>
          <p className="text-sm text-gray-500">
            Reminder: {new Date(notification.reminderTime).toLocaleString()}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <button
            type="button"
            onClick={() => {
              setVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
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
    </div>
  );
}
