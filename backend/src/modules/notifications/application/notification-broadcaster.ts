import type { Response } from "express";
import type { NotificationSoundType, NotificationWithTask } from "../domain/types.js";

export type WorkoutTimerAlertType = "set_complete" | "rest_complete" | "workout_complete";

export interface WorkoutTimerAlert {
  type: WorkoutTimerAlertType;
  sessionId: string;
  exerciseName?: string;
  setNumber?: number;
  soundType: NotificationSoundType;
}

export interface SSEClient {
  id: string;
  response: Response;
  lastHeartbeat: number;
}

export class NotificationBroadcaster {
  private clients: Map<string, SSEClient> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startHeartbeat();
  }

  addClient(clientId: string, response: Response): void {
    const client: SSEClient = {
      id: clientId,
      response,
      lastHeartbeat: Date.now(),
    };

    this.clients.set(clientId, client);
    console.log(`SSE client connected: ${clientId}. Total clients: ${this.clients.size}`);

    response.on("close", () => {
      this.removeClient(clientId);
    });
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`SSE client disconnected: ${clientId}. Total clients: ${this.clients.size}`);
  }

  broadcast(notification: NotificationWithTask): void {
    const eventData = JSON.stringify({
      type: "notification",
      data: {
        id: notification.id,
        taskId: notification.taskId,
        taskTitle: notification.taskTitle,
        taskDate: notification.taskDate,
        taskStartTime: notification.taskStartTime,
        reminderTime: notification.reminderTime,
        soundType: notification.soundType,
        createdAt: notification.createdAt,
      },
    });

    this.sendToAllClients(eventData);
  }

  broadcastWorkoutTimerAlert(alert: WorkoutTimerAlert): void {
    const eventData = JSON.stringify({
      type: "workout_timer",
      data: {
        type: alert.type,
        sessionId: alert.sessionId,
        exerciseName: alert.exerciseName,
        setNumber: alert.setNumber,
        soundType: alert.soundType,
      },
    });

    this.sendToAllClients(eventData);
  }

  private sendToAllClients(eventData: string): void {
    for (const [clientId, client] of this.clients) {
      try {
        client.response.write(`id: ${clientId}\n`);
        client.response.write(`data: ${eventData}\n\n`);
        client.lastHeartbeat = Date.now();
      } catch (error) {
        console.error(`Error sending to client ${clientId}:`, error);
        this.removeClient(clientId);
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000);
  }

  private sendHeartbeat(): void {
    const now = Date.now();
    const STALE_THRESHOLD_MS = 90_000;

    for (const [clientId, client] of this.clients) {
      if (now - client.lastHeartbeat > STALE_THRESHOLD_MS) {
        console.warn(`Removing stale SSE client (inactive > 90s): ${clientId}`);
        this.removeClient(clientId);
        continue;
      }

      try {
        client.response.write(`: heartbeat ${now}\n\n`);
        client.lastHeartbeat = now;
      } catch (error) {
        console.error(`Heartbeat failed for client ${clientId}:`, error);
        this.removeClient(clientId);
      }
    }
  }

  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    for (const [clientId, client] of this.clients) {
      try {
        client.response.end();
      } catch (error) {
        console.error(`Error closing client ${clientId}:`, error);
      }
    }

    this.clients.clear();
    console.log("Notification broadcaster stopped");
  }

  getClientCount(): number {
    return this.clients.size;
  }
}
