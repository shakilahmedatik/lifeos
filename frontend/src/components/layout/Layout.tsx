import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { getDataSource } from "../../lib/dataSource.js";
import { queryKeys } from "../../lib/queryKeys.js";
import { showBrowserNotification } from "../../modules/notifications/browser-notifications.js";
import { NotificationToast } from "../../modules/notifications/NotificationToast.js";
import { playNotificationSound } from "../../modules/notifications/sound-player.js";
import type { SoundPreset } from "../../modules/notifications/sound-presets.js";
import { ToastProvider } from "../Toast.js";
import MobileTabBar from "./MobileTabBar.js";
import Sidebar from "./Sidebar.js";
import Titlebar from "./Titlebar.js";

export default function Layout() {
  const [notification, setNotification] = useState<{
    id: string;
    taskTitle: string;
    reminderTime: string;
    soundType: string;
  } | null>(null);

  const processedIdsRef = useRef<Set<string>>(new Set());

  const ds = getDataSource();

  const { data: dueList } = useQuery({
    queryKey: queryKeys.notifications.due(),
    queryFn: () => ds.getDueNotifications(),
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (dueList && dueList.length > 0) {
      for (const item of dueList) {
        if (!processedIdsRef.current.has(item.id)) {
          processedIdsRef.current.add(item.id);
          const sound = (item.soundType as SoundPreset) || "default";
          playNotificationSound(sound);
          showBrowserNotification(item.taskTitle || "Task Reminder", {
            body: `Reminder for ${item.taskTitle || "scheduled task"}`,
          });
        }
      }
      const last = dueList[dueList.length - 1];
      setNotification({
        id: last.id,
        taskTitle: last.taskTitle || "Task Reminder",
        reminderTime: last.reminderTime,
        soundType: last.soundType,
      });
    }
  }, [dueList]);

  return (
    <ToastProvider>
      <div className="min-h-screen relative overflow-hidden bg-surface flex">
        <Titlebar />
        <Sidebar />

        <main className="flex-1 min-h-screen relative z-10 sm:ml-20">
          <div className="w-full mx-auto px-4 sm:px-8 pt-8 pb-24 sm:pb-8 relative z-10">
            <Outlet />
          </div>
        </main>

        <div className="relative z-50">
          <MobileTabBar />
          <NotificationToast notification={notification} onDismiss={() => setNotification(null)} />
        </div>
      </div>
    </ToastProvider>
  );
}
