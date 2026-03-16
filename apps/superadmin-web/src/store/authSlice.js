/**
 * @module authSlice
 * @description Super admin authentication state.
 *              Stores user, tokens, and loading/error flags.
 *              Persists tokens to localStorage via storage utils.
 */

import { createSlice } from '@reduxjs/toolkit';
import { getItem, setItem, removeItem, clearAll } from '@utils/storage.js';
import { STORAGE_KEYS } from '@utils/constants.js';

const initialState = {
  user:            getItem(STORAGE_KEYS.USER) || null,
  accessToken:     getItem(STORAGE_KEYS.ACCESS_TOKEN) || null,
  isAuthenticated: !!getItem(STORAGE_KEYS.ACCESS_TOKEN),
  isLoading:       false,
  error:           null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.isLoading = true;
      state.error     = null;
    },
    loginSuccess(state, action) {
      const { user, accessToken, refreshToken } = action.payload;
      state.user            = user;
      state.accessToken     = accessToken;
      state.isAuthenticated = true;
      state.isLoading       = false;
      state.error           = null;
      setItem(STORAGE_KEYS.USER,          user);
      setItem(STORAGE_KEYS.ACCESS_TOKEN,  accessToken);
      setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    },
    loginFailure(state, action) {
      state.isLoading = false;
      state.error     = action.payload;
    },
    logout(state) {
      state.user            = null;
      state.accessToken     = null;
      state.isAuthenticated = false;
      state.isLoading       = false;
      state.error           = null;
      clearAll();
    },
    tokenRefreshed(state, action) {
      const { accessToken, refreshToken } = action.payload;
      state.accessToken = accessToken;
      setItem(STORAGE_KEYS.ACCESS_TOKEN,  accessToken);
      setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  tokenRefreshed,
  clearError,
} = authSlice.actions;

// Selectors
export const selectAuth            = (state) => state.auth;
export const selectUser            = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAccessToken     = (state) => state.auth.accessToken;

export default authSlice.reducer;
