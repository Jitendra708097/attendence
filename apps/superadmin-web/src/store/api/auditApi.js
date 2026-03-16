/**
 * @module auditApi
 * @description RTK Query endpoints for platform audit log explorer.
 */

import { baseApi } from './baseApi.js';

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getAuditLogs: builder.query({
      query: (params) => ({ url: '/superadmin/audit-logs', params }),
      providesTags: ['Audit'],
    }),

    getAuditLogById: builder.query({
      query: (id) => ({ url: `/superadmin/audit-logs/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Audit', id }],
    }),

    getOrgAuditLogs: builder.query({
      query: ({ orgId, params }) => ({
        url:    `/superadmin/organisations/${orgId}/audit-logs`,
        params,
      }),
      providesTags: ['Audit'],
    }),

    exportAuditLogs: builder.query({
      query: (params) => ({ url: '/superadmin/audit-logs/export', params }),
    }),

  }),
  overrideExisting: false,
});

export const {
  useGetAuditLogsQuery,
  useGetAuditLogByIdQuery,
  useGetOrgAuditLogsQuery,
  useExportAuditLogsQuery,
} = auditApi;
