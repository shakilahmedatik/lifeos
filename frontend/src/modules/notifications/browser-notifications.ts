import { isTauri } from "../../lib/platform.js";

export async function requestNotificationPermission(): Promise<boolean> {
  if (isTauri()) {
    try {
      const { isPermissionGranted, requestPermission } = await import(
        "@tauri-apps/plugin-notification"
      );
      let granted = await isPermissionGranted();
      if (!granted) {
        const permission = await requestPermission();
        granted = permission === "granted";
      }
      return granted;
    } catch (e) {
      console.warn("Tauri requestNotificationPermission error:", e);
      return false;
    }
  }

  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch {
      return false;
    }
  }

  return false;
}

export async function showBrowserNotification(
  title: string,
  options?: NotificationOptions & { sound?: string },
): Promise<void> {
  if (isTauri()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("show_native_notification", {
        title,
        body: options?.body,
      });
      return;
    } catch (e) {
      console.warn("Tauri invoke show_native_notification failed, trying plugin:", e);
    }

    try {
      const { isPermissionGranted, requestPermission, sendNotification } = await import(
        "@tauri-apps/plugin-notification"
      );
      let granted = await isPermissionGranted();
      if (!granted) {
        const permission = await requestPermission();
        granted = permission === "granted";
      }
      if (granted) {
        sendNotification({
          title,
          body: options?.body,
          sound: options?.sound,
        });
        return;
      }
    } catch (e) {
      console.warn("Tauri sendNotification error, falling back to Web Notification:", e);
    }
  }

  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      try {
        new Notification(title, options);
      } catch (e) {
        console.warn("new Notification failed:", e);
      }
    } else if (Notification.permission !== "denied") {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          new Notification(title, options);
        }
      } catch (e) {
        console.warn("Notification.requestPermission failed:", e);
      }
    }
  }
}
