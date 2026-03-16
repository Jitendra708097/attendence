/**
 * @module uiSlice
 * @description UI state — sidebar collapse, alerts, global modals,
 *              command search visibility, and impersonation banner.
 */

import { createSlice } from '@reduxjs/toolkit';
import { getItem, setItem } from '@utils/storage.js';
import { STORAGE_KEYS } from '@utils/constants.js';

const initialState = {
  sidebarCollapsed:   getItem(STORAGE_KEYS.SIDEBAR) || false,
  commandSearchOpen:  false,
  alerts:             [],          // { id, type, message, org? }
  activeImpersonation: null,       // { orgId, orgName, adminName, startedAt, token }
  globalLoading:      false,
};

let alertIdCounter = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      setItem(STORAGE_KEYS.SIDEBAR, state.sidebarCollapsed);
    },
    setSidebarCollapsed(state, action) {
      state.sidebarCollapsed = action.payload;
      setItem(STORAGE_KEYS.SIDEBAR, action.payload);
    },
    openCommandSearch(state) {
      state.commandSearchOpen = true;
    },
    closeCommandSearch(state) {
      state.commandSearchOpen = false;
    },
    pushAlert(state, action) {
      const id = ++alertIdCounter;
      state.alerts.push({ id, ...action.payload });
    },
    dismissAlert(state, action) {
      state.alerts = state.alerts.filter((a) => a.id !== action.payload);
    },
    clearAlerts(state) {
      state.alerts = [];
    },
    setImpersonation(state, action) {
      state.activeImpersonation = action.payload;
    },
    clearImpersonation(state) {
      state.activeImpersonation = null;
    },
    setGlobalLoading(state, action) {
      state.globalLoading = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  openCommandSearch,
  closeCommandSearch,
  pushAlert,
  dismissAlert,
  clearAlerts,
  setImpersonation,
  clearImpersonation,
  setGlobalLoading,
} = uiSlice.actions;

// Selectors
export const selectSidebarCollapsed  = (state) => state.ui.sidebarCollapsed;
export const selectCommandSearchOpen = (state) => state.ui.commandSearchOpen;
export const selectAlerts            = (state) => state.ui.alerts;
export const selectImpersonation     = (state) => state.ui.activeImpersonation;

export default uiSlice.reducer;
