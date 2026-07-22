import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationBroadcaster } from "../application/notification-broadcaster.js";
import { NotificationScheduler } from "../application/notification-scheduler.js";
import type { NotificationService } from "../application/notification-service.js";
import type { NotificationWithTask } from "../domain/types.js";

describe("NotificationScheduler", () => {
  let scheduler: NotificationScheduler;
  let mockNotificationService: NotificationService;
  let mockBroadcaster: { broadcast: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockNotificationService = {
      getPendingNotifications: vi.fn().mockReturnValue([]),
      markNotificationAsSent: vi.fn().mockReturnValue({}),
    } as unknown as NotificationService;

    mockBroadcaster = {
      broadcast: vi.fn(),
    };

    scheduler = new NotificationScheduler(
      mockNotificationService,
      mockBroadcaster as unknown as NotificationBroadcaster,
    );
  });

  it("should start and stop the scheduler", () => {
    scheduler.start(1000);
    expect(scheduler).toBeDefined();
    scheduler.stop();
  });

  it("should check for pending notifications", async () => {
    const mockNotification: NotificationWithTask = {
      id: "1",
      taskId: "task-1",
      userId: "user-1",
      reminderTime: new Date().toISOString(),
      soundType: "default",
      status: "scheduled",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      taskTitle: "Test Task",
      taskDate: "2024-01-01",
      taskStartTime: "10:00",
    };

    mockNotificationService.getPendingNotifications = vi.fn().mockReturnValue([mockNotification]);

    await scheduler.checkAndSendNotifications();

    expect(mockNotificationService.getPendingNotifications).toHaveBeenCalled();
    expect(mockNotificationService.markNotificationAsSent).toHaveBeenCalledWith("1");
    expect(mockBroadcaster.broadcast).toHaveBeenCalledWith(mockNotification);
  });

  it("should register and unregister listeners", () => {
    const listener = vi.fn();
    const unsubscribe = scheduler.onNotification(listener);

    expect(scheduler.listeners).toContain(listener);

    unsubscribe();
    expect(scheduler.listeners).not.toContain(listener);
  });
});
