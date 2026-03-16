/**
 * @module billingApi
 * @description RTK Query endpoints for platform revenue and billing data.
 */

import { baseApi } from './baseApi.js';

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getRevenueSummary: builder.query({
      query: () => ({ url: '/superadmin/billing/summary' }),
      providesTags: ['Billing'],
    }),

    getMRRHistory: builder.query({
      query: (params) => ({ url: '/superadmin/billing/mrr', params }),
      providesTags: ['Billing'],
    }),

    getPlanBreakdown: builder.query({
      query: () => ({ url: '/superadmin/billing/plans' }),
      providesTags: ['Billing'],
    }),

    getChurnedOrgs: builder.query({
      query: (params) => ({ url: '/superadmin/billing/churn', params }),
      providesTags: ['Billing'],
    }),

    getAllInvoices: builder.query({
      query: (params) => ({ url: '/superadmin/billing/invoices', params }),
      providesTags: ['Billing'],
    }),

    getTopOrgsByMRR: builder.query({
      query: (params) => ({ url: '/superadmin/billing/top-orgs', params }),
      providesTags: ['Billing'],
    }),

  }),
  overrideExisting: false,
});

export const {
  useGetRevenueSummaryQuery,
  useGetMRRHistoryQuery,
  useGetPlanBreakdownQuery,
  useGetChurnedOrgsQuery,
  useGetAllInvoicesQuery,
  useGetTopOrgsByMRRQuery,
} = billingApi;
