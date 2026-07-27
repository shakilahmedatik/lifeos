import { useCallback, useEffect, useRef, useState } from "react";
import { getSSEUrl } from "../../lib/api.js";
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

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const connect = useCallback(() => {
    resumeAudioContext();

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

          optionsRef.current.onNotification?.(notification);
        }
      } catch (err) {
        console.error("Error parsing SSE message:", err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError("SSE connection error");
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
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
