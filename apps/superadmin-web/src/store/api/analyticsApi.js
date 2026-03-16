/**
 * @module analyticsApi
 * @description RTK Query endpoints for platform growth and usage analytics.
 */

import { baseApi } from './baseApi.js';

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getDashboardStats: builder.query({
      query: () => ({ url: '/superadmin/analytics/dashboard' }),
      providesTags: ['Dashboard'],
    }),

    getGrowthMetrics: builder.query({
      query: (params) => ({ url: '/superadmin/analytics/growth', params }),
      providesTags: ['Analytics'],
    }),

    getUsageMetrics: builder.query({
      query: (params) => ({ url: '/superadmin/analytics/usage', params }),
      providesTags: ['Analytics'],
    }),

    getRetentionCohorts: builder.query({
      query: (params) => ({ url: '/superadmin/analytics/retention', params }),
      providesTags: ['Analytics'],
    }),

    getMRRTrend: builder.query({
      query: (params) => ({ url: '/superadmin/analytics/mrr', params }),
      providesTags: ['Analytics'],
    }),

    getOrgGrowthChart: builder.query({
      query: (params) => ({ url: '/superadmin/analytics/orgs/growth', params }),
      providesTags: ['Analytics'],
    }),

    getAlerts: builder.query({
      query: () => ({ url: '/superadmin/analytics/alerts' }),
      providesTags: ['Dashboard'],
    }),

    getRecentSignups: builder.query({
      query: (params) => ({ url: '/superadmin/analytics/signups/recent', params }),
      providesTags: ['Dashboard'],
    }),

  }),
  overrideExisting: false,
});

export const {
  useGetDashboardStatsQuery,
  useGetGrowthMetricsQuery,
  useGetUsageMetricsQuery,
  useGetRetentionCohortsQuery,
  useGetMRRTrendQuery,
  useGetOrgGrowthChartQuery,
  useGetAlertsQuery,
  useGetRecentSignupsQuery,
} = analyticsApi;
