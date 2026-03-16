/**
 * @module impersonateApi
 * @description RTK Query endpoints for org admin impersonation sessions.
 *              Start, end, and history of impersonation sessions.
 */

import { baseApi } from './baseApi.js';

export const impersonateApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    startImpersonation: builder.mutation({
      query: ({ orgId, adminId, reason }) => ({
        url:    '/superadmin/impersonation/start',
        method: 'POST',
        body:   { orgId, adminId, reason },
      }),
      invalidatesTags: ['Impersonation'],
    }),

    endImpersonation: builder.mutation({
      query: ({ sessionId }) => ({
        url:    `/superadmin/impersonation/${sessionId}/end`,
        method: 'POST',
      }),
      invalidatesTags: ['Impersonation'],
    }),

    getActiveSession: builder.query({
      query: () => ({ url: '/superadmin/impersonation/active' }),
      providesTags: ['Impersonation'],
    }),

    getSessionHistory: builder.query({
      query: (params) => ({ url: '/superadmin/impersonation/history', params }),
      providesTags: ['Impersonation'],
    }),

  }),
  overrideExisting: false,
});

export const {
  useStartImpersonationMutation,
  useEndImpersonationMutation,
  useGetActiveSessionQuery,
  useGetSessionHistoryQuery,
} = impersonateApi;
