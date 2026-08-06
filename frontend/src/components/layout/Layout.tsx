import { useState } from "react";
import { Outlet } from "react-router-dom";
import { NotificationToast } from "../../modules/notifications/NotificationToast.js";
import { ToastProvider } from "../Toast.js";
import Dock from "./Sidebar.js";

export default function Layout() {
  const [notification, setNotification] = useState<{
    id: string;
    taskTitle: string;
    reminderTime: string;
    soundType: string;
  } | null>(null);

  return (
    <ToastProvider>
      <div className="min-h-screen  relative overflow-hidden bg-surface">
        <main className="min-h-screen relative z-10">
          <div className=" w-full mx-auto px-6 pt-14 pb-24">
            <Outlet />
          </div>
        </main>

        <div className="relative z-20">
          <Dock />
          <NotificationToast notification={notification} onDismiss={() => setNotification(null)} />
        </div>
      </div>
    </ToastProvider>
  );
}
