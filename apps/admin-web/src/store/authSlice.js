/**
 * @module authSlice
 * @description Redux slice for authentication state management.
 *              Handles login, token refresh, and logout actions.
 */
import { createSlice } from '@reduxjs/toolkit';
import { storage } from '../utils/storage.js';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storage.get('user'),
    accessToken: storage.get('accessToken'),
    refreshToken: storage.get('refreshToken'),
    orgInfo: storage.get('orgInfo'),
    isAuthenticated: !!storage.get('accessToken'),
  },
  reducers: {
    setAuth: (state, action) => {
      const { user, accessToken, refreshToken, org } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.orgInfo = org;
      state.isAuthenticated = true;
      storage.set('user', user);
      storage.set('accessToken', accessToken);
      storage.set('refreshToken', refreshToken);
      storage.set('orgInfo', org);
    },
    setTokens: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      storage.set('accessToken', action.payload.accessToken);
      storage.set('refreshToken', action.payload.refreshToken);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.orgInfo = null;
      state.isAuthenticated = false;
      storage.clear();
    },
  },
});

export const { setAuth, setTokens, logout } = authSlice.actions;
export default authSlice.reducer;
