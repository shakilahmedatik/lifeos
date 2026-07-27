import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationService } from "../application/notification-service.js";
import type { NewNotificationInput } from "../domain/types.js";
import type { NotificationRepository } from "../ports/notification-repository.js";

describe("NotificationService", () => {
  let service: NotificationService;
  let mockRepository: NotificationRepository;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn().mockReturnValue([]),
      findByTaskId: vi.fn().mockReturnValue([]),
      findPendingNotifications: vi.fn().mockReturnValue([]),
      getUnreadCount: vi.fn().mockReturnValue(0),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteByTaskId: vi.fn(),
    };

    service = new NotificationService(mockRepository);
  });

  it("should list notifications for a user", () => {
    const result = service.listNotifications("user-1");
    expect(mockRepository.findByUserId).toHaveBeenCalledWith("user-1");
    expect(result).toEqual([]);
  });

  it("should get a notification by id", () => {
    service.getNotification("1");
    expect(mockRepository.findById).toHaveBeenCalledWith("1");
  });

  it("should create a notification", () => {
    const input: NewNotificationInput = {
      taskId: "task-1",
      reminderTime: "2024-01-01T10:00:00Z",
    };

    service.createNotification(input);
    expect(mockRepository.create).toHaveBeenCalledWith(input);
  });

  it("should update a notification", () => {
    service.updateNotification("1", { status: "sent" });
    expect(mockRepository.update).toHaveBeenCalledWith("1", { status: "sent" });
  });

  it("should delete a notification", () => {
    service.deleteNotification("1");
    expect(mockRepository.delete).toHaveBeenCalledWith("1");
  });

  it("should delete notifications by task id", () => {
    service.deleteNotificationsByTaskId("task-1");
    expect(mockRepository.deleteByTaskId).toHaveBeenCalledWith("task-1");
  });

  it("should get pending notifications", () => {
    service.getPendingNotifications();
    expect(mockRepository.findPendingNotifications).toHaveBeenCalled();
  });

  it("should get unread count", () => {
    const count = service.getUnreadCount("user-1");
    expect(mockRepository.getUnreadCount).toHaveBeenCalledWith("user-1");
    expect(count).toBe(0);
  });
});
