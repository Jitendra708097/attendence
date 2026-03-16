/**
 * @module axiosInstance
 * @description Configured Axios instance with interceptors for JWT token management
 *              and automatic token refresh on 401 responses.
 */
import axios from 'axios';
import { message } from 'antd';

let store;

// Function to lazily import store to avoid circular dependencies
const getStore = async () => {
  if (!store) {
    const { store: importedStore } = await import('../store/index.js');
    store = importedStore;
  }
  return store;
};

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  timeout: 30000,
});

// Request interceptor — attach access token
axiosInstance.interceptors.request.use(async (config) => {
  const storeInstance = await getStore();
  const token = storeInstance.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — refresh token on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const storeInstance = await getStore();
        const refreshToken = storeInstance.getState().auth.refreshToken;

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/v1/auth/refresh`,
          { refreshToken }
        );

        const { setTokens } = await import('../store/authSlice.js');
        storeInstance.dispatch(setTokens(response.data.data));

        original.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
        return axiosInstance(original);
      } catch (err) {
        const storeInstance = await getStore();
        const { logout } = await import('../store/authSlice.js');
        storeInstance.dispatch(logout());
        message.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
