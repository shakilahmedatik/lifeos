import { useCallback, useEffect, useRef, useState } from "react";
import { getSSEUrl } from "../../lib/api.js";
import { requestNotificationPermission, showBrowserNotification } from "./browser-notifications.js";
import { playNotificationSound, resumeAudioContext } from "./sound-player.js";
import type { SoundPreset } from "./sound-presets.js";

interface NotificationEvent {
  id: string;
  taskId: string;
  taskTitle: string;
  taskDate: string;
  taskStartTime: string;
  reminderTime: string;
  soundType: SoundPreset;
  createdAt: string;
}

interface UseNotificationSSEOptions {
  onNotification?: (notification: NotificationEvent) => void;
  autoPlaySound?: boolean;
}

export function useNotificationSSE(options: UseNotificationSSEOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<NotificationEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Request browser notification permissions on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Listen for user interaction to unblock Web Audio API AudioContext
  useEffect(() => {
    const handleInteraction = () => {
      resumeAudioContext();
    };
    window.addEventListener("click", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });
    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  const connect = useCallback(() => {
    resumeAudioContext();
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const eventSource = new EventSource(getSSEUrl("/api/notifications/stream"));

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "notification") {
          const notification = data.data as NotificationEvent;
          setLastNotification(notification);

          if (optionsRef.current.autoPlaySound !== false) {
            playNotificationSound(notification.soundType);
          }

          // Trigger native OS desktop notification
          showBrowserNotification(`Reminder: ${notification.taskTitle}`, {
            body: `Scheduled for ${notification.taskStartTime} (${notification.taskDate})`,
            icon: "/favicon.ico",
          });

          optionsRef.current.onNotification?.(notification);
        }
      } catch (err) {
        console.error("Error parsing SSE message:", err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError("SSE connection error. Retrying...");
      eventSource.close();

      // Schedule reconnection with backoff
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return {
    isConnected,
    lastNotification,
    error,
    reconnect: connect,
  };
}
