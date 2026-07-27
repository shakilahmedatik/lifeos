import { useCallback, useEffect, useRef, useState } from "react";
import { getSSEUrl } from "../../lib/api.js";
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
      setIsConnected(false);
      setError("Workout timer SSE connection error");
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
    lastAlert,
    error,
    reconnect: connect,
  };
}
