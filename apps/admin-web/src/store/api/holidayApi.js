/**
 * @module holidayApi
 * @description RTK Query API for holiday endpoints (CRUD, calendar).
 */
import { baseApi } from './baseApi.js';

export const holidayApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHolidays: builder.query({
      query: (params) => ({
        url: '/holidays',
        params,
      }),
      providesTags: ['Holidays'],
    }),
    getHolidayDetail: builder.query({
      query: (id) => ({
        url: `/holidays/${id}`,
      }),
      providesTags: ['Holidays'],
    }),
    createHoliday: builder.mutation({
      query: (body) => ({
        url: '/holidays',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Holidays'],
    }),
    updateHoliday: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/holidays/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Holidays'],
    }),
    deleteHoliday: builder.mutation({
      query: (id) => ({
        url: `/holidays/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Holidays'],
    }),
    bulkImportHolidays: builder.mutation({
      query: (body) => ({
        url: '/holidays/bulk-import',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Holidays'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetHolidaysQuery,
  useGetHolidayDetailQuery,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
  useBulkImportHolidaysMutation,
} = holidayApi;
