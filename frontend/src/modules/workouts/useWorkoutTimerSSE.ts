import { useCallback, useEffect, useRef, useState } from "react";

import { playNotificationSound, resumeAudioContext } from "../notifications/sound-player.js";
import type { SoundPreset } from "../notifications/sound-presets.js";

export type WorkoutTimerAlertType = "set_complete" | "rest_complete" | "workout_complete";

export interface WorkoutTimerAlert {
  type: WorkoutTimerAlertType;
  sessionId: string;
  exerciseName?: string;
  setNumber?: number;
  soundType: SoundPreset;
}

interface UseWorkoutTimerSSEOptions {
  onAlert?: (alert: WorkoutTimerAlert) => void;
  autoPlaySound?: boolean;
}

export function useWorkoutTimerSSE(options: UseWorkoutTimerSSEOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastAlert, setLastAlert] = useState<WorkoutTimerAlert | null>(null);
  const [error, setError] = useState<string | null>(null);

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disposedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    resumeAudioContext();
    cleanup();

    const eventSource = new EventSource("/api/notifications/stream");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      if (disposedRef.current) return;
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      if (disposedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === "workout_timer") {
          const alert = data.data as WorkoutTimerAlert;
          setLastAlert(alert);

          if (optionsRef.current.autoPlaySound !== false) {
            playNotificationSound(alert.soundType);
          }

          optionsRef.current.onAlert?.(alert);
        }
      } catch (err) {
        console.error("Error parsing workout timer SSE message:", err);
      }
    };

    eventSource.onerror = () => {
      if (disposedRef.current) return;
      setIsConnected(false);
      setError("Workout timer SSE connection error. Retrying...");
      eventSource.close();
      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current = null;
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connect();
      }, 5000);
    };
  }, [cleanup]);

  useEffect(() => {
    disposedRef.current = false;
    connect();
    return () => {
      disposedRef.current = true;
      cleanup();
    };
  }, [connect, cleanup]);

  return {
    isConnected,
    lastAlert,
    error,
    reconnect: connect,
  };
}
