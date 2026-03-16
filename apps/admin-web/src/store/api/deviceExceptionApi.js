/**
 * @module deviceExceptionApi
 * @description RTK Query API for device exception endpoints (approve, reject).
 */
import { baseApi } from './baseApi.js';

export const deviceExceptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDeviceExceptions: builder.query({
      query: (params) => ({
        url: '/device-exceptions',
        params,
      }),
      providesTags: ['DeviceExceptions'],
    }),
    approveDeviceException: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/device-exceptions/${id}/approve`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DeviceExceptions'],
    }),
    rejectDeviceException: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/device-exceptions/${id}/reject`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DeviceExceptions'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDeviceExceptionsQuery,
  useApproveDeviceExceptionMutation,
  useRejectDeviceExceptionMutation,
} = deviceExceptionApi;
