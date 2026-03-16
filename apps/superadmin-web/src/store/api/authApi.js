/**
 * @module authApi
 * @description RTK Query endpoints for super admin authentication.
 *              login, logout, refresh token.
 */

import { baseApi } from './baseApi.js';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    superAdminLogin: builder.mutation({
      query: ({ email, password }) => ({
        url:    '/superadmin/auth/login',
        method: 'POST',
        body:   { email, password },
      }),
    }),

    superAdminLogout: builder.mutation({
      query: ({ refreshToken }) => ({
        url:    '/superadmin/auth/logout',
        method: 'POST',
        body:   { refreshToken },
      }),
    }),

    refreshToken: builder.mutation({
      query: ({ refreshToken }) => ({
        url:    '/superadmin/auth/refresh',
        method: 'POST',
        body:   { refreshToken },
      }),
    }),

    getMe: builder.query({
      query: () => ({ url: '/superadmin/auth/me' }),
    }),

  }),
  overrideExisting: false,
});

export const {
  useSuperAdminLoginMutation,
  useSuperAdminLogoutMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
} = authApi;
