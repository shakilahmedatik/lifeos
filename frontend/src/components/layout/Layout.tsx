import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { api } from "../../lib/api.js";
import { useVisibilityPolling } from "../../lib/useVisibilityPolling.js";
import { showBrowserNotification } from "../../modules/notifications/browser-notifications.js";
import { NotificationToast } from "../../modules/notifications/NotificationToast.js";
import { playNotificationSound } from "../../modules/notifications/sound-player.js";
import type { SoundPreset } from "../../modules/notifications/sound-presets.js";
import { ToastProvider } from "../Toast.js";
import Dock from "./Dock.js";

export default function Layout() {
  const [notification, setNotification] = useState<{
    id: string;
    taskTitle: string;
    reminderTime: string;
    soundType: string;
  } | null>(null);

  const checkDueNotifications = useCallback(async () => {
    try {
      const dueList = await api.getDueNotifications();
      if (dueList && dueList.length > 0) {
        for (const item of dueList) {
          const sound = (item.soundType as SoundPreset) || "default";
          playNotificationSound(sound);
          showBrowserNotification(item.taskTitle || "Task Reminder", {
            body: `Reminder for ${item.taskTitle || "scheduled task"}`,
          });
        }
        const last = dueList[dueList.length - 1];
        setNotification({
          id: last.id,
          taskTitle: last.taskTitle || "Task Reminder",
          reminderTime: last.reminderTime,
          soundType: last.soundType,
        });
      }
    } catch {
      // Background notification polling silently handles errors
    }
  }, []);

  useVisibilityPolling(checkDueNotifications, 15000);

  return (
    <ToastProvider>
      <div className="min-h-screen relative overflow-hidden bg-surface">
        <main className="min-h-screen relative z-10">
          <div className="w-full mx-auto px-6 pt-14 pb-24">
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
