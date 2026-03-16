/**
 * @module leaveApi
 * @description RTK Query API for leave endpoints (list, approve, reject, calendar).
 */
import { baseApi } from './baseApi.js';

export const leaveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeaves: builder.query({
      query: (params) => ({
        url: '/leaves',
        params,
      }),
      providesTags: ['Leaves'],
    }),
    getLeaveDetail: builder.query({
      query: (id) => ({
        url: `/leaves/${id}`,
      }),
      providesTags: ['Leaves'],
    }),
    approveLeave: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/leaves/${id}/approve`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Leaves'],
    }),
    rejectLeave: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/leaves/${id}/reject`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Leaves'],
    }),
    getLeaveCalendar: builder.query({
      query: (params) => ({
        url: '/leaves/calendar',
        params,
      }),
      providesTags: ['Leaves'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetLeavesQuery,
  useGetLeaveDetailQuery,
  useApproveLeavesMutation,
  useRejectLeavesMutation,
  useGetLeaveCalendarQuery,
} = leaveApi;
