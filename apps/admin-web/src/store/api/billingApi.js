/**
 * @module billingApi
 * @description RTK Query API for billing endpoints (plan, subscribe, invoices).
 */
import { baseApi } from './baseApi.js';

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentPlan: builder.query({
      query: () => ({
        url: '/billing/current-plan',
      }),
      providesTags: ['Billing'],
    }),
    getAvailablePlans: builder.query({
      query: () => ({
        url: '/billing/plans',
      }),
      providesTags: ['Billing'],
    }),
    subscribeToPlan: builder.mutation({
      query: (body) => ({
        url: '/billing/subscribe',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Billing'],
    }),
    getInvoices: builder.query({
      query: (params) => ({
        url: '/billing/invoices',
        params,
      }),
      providesTags: ['Billing'],
    }),
    downloadInvoice: builder.query({
      query: (id) => ({
        url: `/billing/invoices/${id}/download`,
      }),
      providesTags: ['Billing'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCurrentPlanQuery,
  useGetAvailablePlansQuery,
  useSubscribeToPlanMutation,
  useGetInvoicesQuery,
  useDownloadInvoiceQuery,
} = billingApi;
