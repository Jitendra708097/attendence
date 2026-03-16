/**
 * @module notificationStore
 * @description Zustand store for in-app notifications.
 *              Tracks unread count (used for bell badge in HomeScreen header).
 *              Loads full notification list for NotificationsScreen.
 *              Called by: MainNavigator (bell badge), NotificationsScreen.
 */

import { create } from 'zustand';
import api from '../api/axiosInstance.js';
import { parseError } from '../utils/errorParser.js';
import { API_ROUTES } from '../utils/constants.js';

const useNotificationStore = create((set, get) => ({
  // ─── State ─────────────────────────────────────────────────────────────────
  notifications: [],
  unreadCount:   0,
  isLoading:     false,
  error:         null,
  page:          1,
  hasMore:       true,

  // ─── Load notifications (paginated) ────────────────────────────────────────
  loadNotifications: async (reset = false) => {
    if (get().isLoading) return;
    if (!reset && !get().hasMore) return;

    const page = reset ? 1 : get().page;
    set({ isLoading: true, error: null });

    try {
      const res  = await api.get(API_ROUTES.NOTIFICATIONS, {
        params: { page, limit: 20 },
      });
      const { notifications, unreadCount, hasMore } = res.data.data;

      set((state) => ({
        notifications: reset ? notifications : [...state.notifications, ...notifications],
        unreadCount,
        page:     page + 1,
        hasMore,
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: parseError(err) });
    }
  },

  // ─── Refresh unread count only (for bell badge) ─────────────────────────────
  refreshUnreadCount: async () => {
    try {
      const res = await api.get(`${API_ROUTES.NOTIFICATIONS}/unread-count`);
      set({ unreadCount: res.data.data.unreadCount });
    } catch {
      // Non-critical — silent fail
    }
  },

  // ─── Mark a single notification as read ────────────────────────────────────
  markAsRead: async (notificationId) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await api.patch(`${API_ROUTES.NOTIFICATIONS}/${notificationId}/read`);
    } catch {
      // Revert on failure
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: false } : n
        ),
        unreadCount: state.unreadCount + 1,
      }));
    }
  },

  // ─── Mark all as read ───────────────────────────────────────────────────────
  markAllAsRead: async () => {
    // Optimistic update
    const prevNotifications = get().notifications;
    const prevCount         = get().unreadCount;

    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount:   0,
    }));

    try {
      await api.post(API_ROUTES.NOTIFICATIONS_READ);
    } catch {
      set({ notifications: prevNotifications, unreadCount: prevCount });
    }
  },

  // ─── Add incoming push notification to list ─────────────────────────────────
  addIncomingNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount:   state.unreadCount + 1,
    }));
  },

  // ─── Helpers ────────────────────────────────────────────────────────────────
  clearError: () => set({ error: null }),
}));

export default useNotificationStore;
