/**
 * @module regularisationApi
 * @description RTK Query API for regularisation endpoints (list, approve, reject).
 */
import { baseApi } from './baseApi.js';

export const regularisationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRegularisations: builder.query({
      query: (params) => ({
        url: '/regularisations',
        params,
      }),
      providesTags: ['Regularisations'],
    }),
    getRegularisationDetail: builder.query({
      query: (id) => ({
        url: `/regularisations/${id}`,
      }),
      providesTags: ['Regularisations'],
    }),
    approveRegularisation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/regularisations/${id}/approve`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Regularisations'],
    }),
    rejectRegularisation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/regularisations/${id}/reject`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Regularisations'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetRegularisationsQuery,
  useGetRegularisationDetailQuery,
  useApproveRegularisationMutation,
  useRejectRegularisationMutation,
} = regularisationApi;
