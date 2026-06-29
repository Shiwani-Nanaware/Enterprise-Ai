/**
 * Notifications Zustand store.
 * Manages in-app notification state with read/unread tracking.
 */

import { create } from "zustand";
import { MOCK_NOTIFICATIONS, type MockNotification } from "@/data/mock-data";

interface NotificationState {
  notifications: MockNotification[];
  unreadCount: number;

  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<MockNotification, "id" | "created_at">) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: MOCK_NOTIFICATIONS,
  unreadCount: MOCK_NOTIFICATIONS.filter((n) => !n.read).length,

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  addNotification: (notification) => {
    const newNotif: MockNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
      unreadCount: state.unreadCount + (newNotif.read ? 0 : 1),
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const removed = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: state.unreadCount - (removed && !removed.read ? 1 : 0),
      };
    });
  },
}));
