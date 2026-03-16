/**
 * @module axiosInstance
 * @description Axios instance for all AttendEase API calls.
 *              Base URL: /api/v1/
 *              Request interceptor: attaches Bearer token from SecureStore.
 *              Response interceptor: silently refreshes token on 401,
 *              then retries original request once.
 *              On refresh failure: calls authStore.logout() → Login screen.
 *              Called by: all store actions, all services making API calls.
 */

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://api.attendease.com/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor — Attach Access Token ───────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — Refresh on 401 ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data.data;

        await SecureStore.setItemAsync('accessToken', accessToken);
        await SecureStore.setItemAsync('refreshToken', newRefresh);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (_refreshError) {
        // Lazy import to avoid circular dependency
        const { default: useAuthStore } = await import('../store/authStore.js');
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
