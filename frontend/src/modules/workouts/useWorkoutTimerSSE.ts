import { useCallback, useEffect, useState } from "react";
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

  const connect = useCallback(() => {
    resumeAudioContext();

    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log("Workout timer SSE connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "workout_timer") {
          const alert = data.data as WorkoutTimerAlert;
          setLastAlert(alert);

          if (options.autoPlaySound !== false) {
            playNotificationSound(alert.soundType);
          }

          options.onAlert?.(alert);
        }
      } catch (err) {
        console.error("Error parsing workout timer SSE message:", err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError("Workout timer SSE connection error");
      console.log("Workout timer SSE connection error, will retry...");
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [options]);

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
