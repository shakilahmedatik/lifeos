import { useState } from "react";
import { Outlet } from "react-router-dom";
import { NotificationToast } from "../../modules/notifications/NotificationToast.js";
import { useNotificationSSE } from "../../modules/notifications/useNotificationSSE.js";
import { ToastContainer, ToastProvider, useAppToast } from "../Toast.js";
import { ShaderBackground } from "../ui/ShaderBackground.js";
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
      <div className="min-h-screen relative overflow-hidden bg-surface">
        <div className="fixed inset-0 z-0">
          <ShaderBackground
            variant="grain-gradient"
            colors={["#7300ff", "#eba8ff", "#00bfff", "#2a00ff"]}
            colorBack="#000000"
            softness={0.6}
            speed={0.5}
          />
        </div>
        <div className="fixed inset-0 z-0 glass-heavy" />

        <main className="min-h-screen relative z-10">
          <div className="max-w-7xl mx-auto px-6 pt-14 pb-24">
            <Outlet />
          </div>
        </main>

        <div className="relative z-20">
          <Dock />
          <LayoutToast />
          <NotificationToast notification={notification} onDismiss={() => setNotification(null)} />
        </div>
      </div>
    </ToastProvider>
  );
}
