/**
 * @module attendanceApi
 * @description RTK Query API for attendance endpoints (list, live board, export).
 */
import { baseApi } from './baseApi.js';

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAttendance: builder.query({
      query: (params) => ({
        url: '/attendance',
        params,
      }),
      providesTags: ['Attendance'],
    }),
    getAttendanceDetail: builder.query({
      query: (id) => ({
        url: `/attendance/${id}`,
      }),
      providesTags: ['Attendance'],
    }),
    getLiveBoard: builder.query({
      query: (params) => ({
        url: '/attendance/live-board',
        params,
      }),
      providesTags: ['Attendance'],
    }),
    flagAnomaly: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/attendance/${id}/flag-anomaly`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Attendance'],
    }),
    unflagAnomaly: builder.mutation({
      query: (id) => ({
        url: `/attendance/${id}/unflag-anomaly`,
        method: 'PUT',
      }),
      invalidatesTags: ['Attendance'],
    }),
    exportAttendance: builder.mutation({
      query: (body) => ({
        url: '/attendance/export',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Attendance'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAttendanceQuery,
  useGetAttendanceDetailQuery,
  useGetLiveBoardQuery,
  useFlagAnomalyMutation,
  useUnflagAnomalyMutation,
  useExportAttendanceMutation,
} = attendanceApi;
