/**
 * @module shiftApi
 * @description RTK Query API for shift endpoints (CRUD).
 */
import { baseApi } from './baseApi.js';

export const shiftApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getShifts: builder.query({
      query: (params) => ({
        url: '/shifts',
        params,
      }),
      providesTags: ['Shifts'],
    }),
    getShiftDetail: builder.query({
      query: (id) => ({
        url: `/shifts/${id}`,
      }),
      providesTags: ['Shifts'],
    }),
    createShift: builder.mutation({
      query: (body) => ({
        url: '/shifts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Shifts'],
    }),
    updateShift: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/shifts/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Shifts'],
    }),
    deleteShift: builder.mutation({
      query: (id) => ({
        url: `/shifts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Shifts'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetShiftsQuery,
  useGetShiftDetailQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
} = shiftApi;
