import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationService } from "../application/notification-service.js";
import type { NewNotificationInput, Notification } from "../domain/types.js";
import type { NotificationRepository } from "../ports/notification-repository.js";

describe("NotificationService", () => {
  let service: NotificationService;
  let mockRepository: NotificationRepository;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn().mockResolvedValue(undefined),
      findByUserId: vi.fn().mockResolvedValue([]),
      findByTaskId: vi.fn().mockResolvedValue([]),
      findPendingNotifications: vi.fn().mockResolvedValue([]),
      getUnreadCount: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({} as Notification),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(true),
      deleteByTaskId: vi.fn().mockResolvedValue(true),
      getSoundPreference: vi.fn().mockResolvedValue("default"),
      setSoundPreference: vi.fn().mockResolvedValue(undefined),
    };

    service = new NotificationService(mockRepository);
  });

  it("should list notifications for a user", async () => {
    const result = await service.listNotifications("user-1");
    expect(mockRepository.findByUserId).toHaveBeenCalledWith("user-1");
    expect(result).toEqual([]);
  });

  it("should get a notification by id", async () => {
    await service.getNotification("1");
    expect(mockRepository.findById).toHaveBeenCalledWith("1");
  });

  it("should create a notification", async () => {
    const input: NewNotificationInput = {
      taskId: "task-1",
      reminderTime: "2024-01-01T10:00:00Z",
    };

    await service.createNotification(input);
    expect(mockRepository.create).toHaveBeenCalledWith(input);
  });

  it("should update a notification", async () => {
    await service.updateNotification("1", { status: "sent" });
    expect(mockRepository.update).toHaveBeenCalledWith("1", { status: "sent" });
  });

  it("should delete a notification", async () => {
    await service.deleteNotification("1");
    expect(mockRepository.delete).toHaveBeenCalledWith("1");
  });

  it("should delete notifications by task id", async () => {
    await service.deleteNotificationsByTaskId("task-1");
    expect(mockRepository.deleteByTaskId).toHaveBeenCalledWith("task-1");
  });

  it("should get pending notifications", async () => {
    await service.getPendingNotifications();
    expect(mockRepository.findPendingNotifications).toHaveBeenCalled();
  });

  it("should get unread count", async () => {
    const count = await service.getUnreadCount("user-1");
    expect(mockRepository.getUnreadCount).toHaveBeenCalledWith("user-1");
    expect(count).toBe(0);
  });

  it("should get and set sound preferences", async () => {
    const sound = await service.getSoundPreference("user-1");
    expect(mockRepository.getSoundPreference).toHaveBeenCalledWith("user-1");
    expect(sound).toBe("default");

    await service.setSoundPreference("user-1", "urgent");
    expect(mockRepository.setSoundPreference).toHaveBeenCalledWith("user-1", "urgent");
  });
});
