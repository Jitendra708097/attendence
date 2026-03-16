/**
 * @module employeeApi
 * @description RTK Query API for employee endpoints (CRUD, bulk upload).
 */
import { baseApi } from './baseApi.js';

export const employeeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query({
      query: (params) => ({
        url: '/employees',
        params,
      }),
      providesTags: ['Employees'],
    }),
    getEmployeeDetail: builder.query({
      query: (id) => ({
        url: `/employees/${id}`,
      }),
      providesTags: ['Employees'],
    }),
    createEmployee: builder.mutation({
      query: (body) => ({
        url: '/employees',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Employees'],
    }),
    updateEmployee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/employees/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Employees'],
    }),
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `/employees/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Employees'],
    }),
    bulkUploadEmployees: builder.mutation({
      query: (body) => ({
        url: '/employees/bulk-upload',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Employees'],
    }),
    getEmployeeLeaveBalance: builder.query({
      query: (id) => ({
        url: `/employees/${id}/leave-balance`,
      }),
      providesTags: ['Employees'],
    }),
    updateLeaveBalance: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/employees/${id}/leave-balance`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Employees'],
    }),
    resendInvite: builder.mutation({
      query: (id) => ({
        url: `/employees/${id}/resend-invite`,
        method: 'POST',
      }),
      invalidatesTags: ['Employees'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeDetailQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useBulkUploadEmployeesMutation,
  useGetEmployeeLeaveBalanceQuery,
  useUpdateLeaveBalanceMutation,
  useResendInviteMutation,
} = employeeApi;
