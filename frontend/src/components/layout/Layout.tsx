import { useState } from "react";
import { Outlet } from "react-router-dom";
import { NotificationToast } from "../../modules/notifications/NotificationToast.js";
import { useNotificationSSE } from "../../modules/notifications/useNotificationSSE.js";
import { ToastContainer, ToastProvider, useAppToast } from "../Toast.js";
import Dock from "./Sidebar.js";

function LayoutToast() {
  const { toasts } = useAppToast();
  return <ToastContainer toasts={toasts} />;
}

export default function Layout() {
  const [notification, setNotification] = useState<{
    id: string;
    taskTitle: string;
    reminderTime: string;
    soundType: string;
  } | null>(null);

  useNotificationSSE({
    onNotification: (n) =>
      setNotification({
        id: n.id,
        taskTitle: n.taskTitle,
        reminderTime: n.reminderTime,
        soundType: n.soundType,
      }),
  });

  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface">
        <main className="min-h-screen">
          <div className="max-w-5xl mx-auto px-6 pt-14 pb-24">
            <Outlet />
          </div>
        </main>
        <Dock />
        <LayoutToast />
        <NotificationToast notification={notification} onDismiss={() => setNotification(null)} />
      </div>
    </ToastProvider>
  );
}
