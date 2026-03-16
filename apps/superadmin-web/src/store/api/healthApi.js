/**
 * @module healthApi
 * @description RTK Query endpoints for platform health monitoring.
 *              Database, Redis, Bull Queues, API metrics.
 */

import { baseApi } from './baseApi.js';

export const healthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getPlatformHealth: builder.query({
      query: () => ({ url: '/superadmin/health' }),
      providesTags: ['Health'],
    }),

    getQueueStatus: builder.query({
      query: () => ({ url: '/superadmin/health/queues' }),
      providesTags: ['Health'],
    }),

    getQueueByName: builder.query({
      query: (name) => ({ url: `/superadmin/health/queues/${name}` }),
      providesTags: ['Health'],
    }),

    getFailedJobs: builder.query({
      query: (params) => ({ url: '/superadmin/health/queues/failed', params }),
      providesTags: ['Health'],
    }),

    retryJob: builder.mutation({
      query: ({ queue, jobId }) => ({
        url:    `/superadmin/health/queues/${queue}/retry/${jobId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Health'],
    }),

    retryAllFailed: builder.mutation({
      query: ({ queue }) => ({
        url:    `/superadmin/health/queues/${queue}/retry-all`,
        method: 'POST',
      }),
      invalidatesTags: ['Health'],
    }),

    getApiMetrics: builder.query({
      query: (params) => ({ url: '/superadmin/health/metrics', params }),
      providesTags: ['Health'],
    }),

    getDatabaseStatus: builder.query({
      query: () => ({ url: '/superadmin/health/database' }),
      providesTags: ['Health'],
    }),

  }),
  overrideExisting: false,
});

export const {
  useGetPlatformHealthQuery,
  useGetQueueStatusQuery,
  useGetQueueByNameQuery,
  useGetFailedJobsQuery,
  useRetryJobMutation,
  useRetryAllFailedMutation,
  useGetApiMetricsQuery,
  useGetDatabaseStatusQuery,
} = healthApi;
