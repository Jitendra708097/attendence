/**
 * @module orgApi
 * @description RTK Query endpoints for organisation management.
 *              list, detail, suspend, activate, change plan, extend trial.
 */

import { baseApi } from './baseApi.js';

export const orgApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getAllOrgs: builder.query({
      query: (params) => ({ url: '/superadmin/organisations', params }),
      providesTags: ['Orgs'],
    }),

    getOrgById: builder.query({
      query: (id) => ({ url: `/superadmin/organisations/${id}` }),
      providesTags: (result, error, id) => [{ type: 'OrgDetail', id }],
    }),

    getOrgEmployees: builder.query({
      query: ({ id, params }) => ({
        url:    `/superadmin/organisations/${id}/employees`,
        params,
      }),
      providesTags: (result, error, { id }) => [{ type: 'OrgDetail', id }],
    }),

    getOrgAttendanceSummary: builder.query({
      query: (id) => ({ url: `/superadmin/organisations/${id}/attendance/today` }),
    }),

    getOrgBillingHistory: builder.query({
      query: ({ id, params }) => ({
        url:    `/superadmin/organisations/${id}/billing`,
        params,
      }),
    }),

    suspendOrg: builder.mutation({
      query: ({ id, reason }) => ({
        url:    `/superadmin/organisations/${id}/suspend`,
        method: 'PUT',
        body:   { reason },
      }),
      invalidatesTags: ['Orgs', 'Dashboard'],
    }),

    activateOrg: builder.mutation({
      query: (id) => ({
        url:    `/superadmin/organisations/${id}/activate`,
        method: 'PUT',
      }),
      invalidatesTags: ['Orgs', 'Dashboard'],
    }),

    changePlan: builder.mutation({
      query: ({ id, plan, reason }) => ({
        url:    `/superadmin/organisations/${id}/plan`,
        method: 'PUT',
        body:   { plan, reason },
      }),
      invalidatesTags: ['Orgs', { type: 'OrgDetail' }],
    }),

    extendTrial: builder.mutation({
      query: ({ id, days, reason }) => ({
        url:    `/superadmin/organisations/${id}/trial`,
        method: 'PUT',
        body:   { extendByDays: days, reason },
      }),
      invalidatesTags: ['Orgs', { type: 'OrgDetail' }],
    }),

    exportOrgs: builder.query({
      query: (params) => ({ url: '/superadmin/organisations/export', params }),
    }),

    searchOrgs: builder.query({
      query: ({ q }) => ({ url: '/superadmin/organisations/search', params: { q } }),
    }),

  }),
  overrideExisting: false,
});

export const {
  useGetAllOrgsQuery,
  useGetOrgByIdQuery,
  useGetOrgEmployeesQuery,
  useGetOrgAttendanceSummaryQuery,
  useGetOrgBillingHistoryQuery,
  useSuspendOrgMutation,
  useActivateOrgMutation,
  useChangePlanMutation,
  useExtendTrialMutation,
  useExportOrgsQuery,
  useSearchOrgsQuery,
} = orgApi;
