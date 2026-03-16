/**
 * @module authStore
 * @description Zustand store for authentication state.
 *              Handles login, logout, token persistence in SecureStore,
 *              first login detection, and face enrollment status.
 *              Access token: 15 min expiry (refreshed by axiosInstance).
 *              Refresh token: rotated on every use.
 *              Called by: AppNavigator, LoginScreen, all screens via auth guard.
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../api/axiosInstance.js';
import { parseError } from '../utils/errorParser.js';
import { getDevicePayload } from '../services/deviceService.js';
import { STORAGE_KEYS, API_ROUTES } from '../utils/constants.js';

const useAuthStore = create((set, get) => ({
  // ─── State ─────────────────────────────────────────────────────────────────
  isAuthenticated: false,
  isLoading:       true,   // true during boot token check
  user:            null,   // { id, name, email, orgId, role, faceEnrolled, isFirstLogin }
  error:           null,

  // ─── Hydrate from SecureStore on app boot ───────────────────────────────────
  hydrate: async () => {
    try {
      const token    = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);

      if (token && userData) {
        set({
          isAuthenticated: true,
          user:            JSON.parse(userData),
          isLoading:       false,
        });
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  // ─── Login ──────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const devicePayload = await getDevicePayload();

      const res = await api.post(API_ROUTES.LOGIN, {
        email:    email.trim().toLowerCase(),
        password,
        ...devicePayload,
      });

      const { accessToken, refreshToken, employee } = res.data.data;

      // Persist tokens in SecureStore — never AsyncStorage
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN,  accessToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA,     JSON.stringify(employee));

      set({
        isAuthenticated: true,
        user:            employee,
        isLoading:       false,
        error:           null,
      });

      return { success: true, employee };
    } catch (err) {
      const message = parseError(err);
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // ─── Set Password (first login) ─────────────────────────────────────────────
  setPassword: async (newPassword) => {
    set({ isLoading: true, error: null });

    try {
      await api.post(API_ROUTES.SET_PASSWORD, { newPassword });

      // Update local user — no longer first login
      const updatedUser = { ...get().user, isFirstLogin: false };
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

      set({ user: updatedUser, isLoading: false });
      return { success: true };
    } catch (err) {
      const message = parseError(err);
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // ─── Mark face as enrolled locally ─────────────────────────────────────────
  markFaceEnrolled: async () => {
    const updatedUser = { ...get().user, faceEnrolled: true };
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  // ─── Change Password ────────────────────────────────────────────────────────
  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null });

    try {
      await api.post(API_ROUTES.CHANGE_PASSWORD, { currentPassword, newPassword });
      set({ isLoading: false });
      return { success: true };
    } catch (err) {
      const message = parseError(err);
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // ─── Logout ─────────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        // Best-effort — don't block logout on API failure
        await api.post(API_ROUTES.LOGOUT, { refreshToken }).catch(() => {});
      }
    } finally {
      // Always clear local state and tokens
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);

      set({
        isAuthenticated: false,
        user:            null,
        error:           null,
        isLoading:       false,
      });
    }
  },

  // ─── Helpers ────────────────────────────────────────────────────────────────
  clearError: () => set({ error: null }),
  setError:   (msg) => set({ error: msg }),
}));

export default useAuthStore;
