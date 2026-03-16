/**
 * @module featureFlagApi
 * @description RTK Query endpoints for feature flag management.
 *              Global toggles and per-org overrides.
 */

import { baseApi } from './baseApi.js';

export const featureFlagApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getAllFlags: builder.query({
      query: () => ({ url: '/superadmin/feature-flags' }),
      providesTags: ['FeatureFlags'],
    }),

    setGlobalFlag: builder.mutation({
      query: ({ key, enabled }) => ({
        url:    `/superadmin/feature-flags/${key}/global`,
        method: 'PUT',
        body:   { enabled },
      }),
      invalidatesTags: ['FeatureFlags'],
    }),

    setOrgFlagOverride: builder.mutation({
      query: ({ key, orgId, enabled }) => ({
        url:    `/superadmin/feature-flags/${key}/orgs/${orgId}`,
        method: 'PUT',
        body:   { enabled },
      }),
      invalidatesTags: ['FeatureFlags'],
    }),

    removeOrgFlagOverride: builder.mutation({
      query: ({ key, orgId }) => ({
        url:    `/superadmin/feature-flags/${key}/orgs/${orgId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FeatureFlags'],
    }),

    getFlagOrgs: builder.query({
      query: (key) => ({ url: `/superadmin/feature-flags/${key}/orgs` }),
      providesTags: ['FeatureFlags'],
    }),

  }),
  overrideExisting: false,
});

export const {
  useGetAllFlagsQuery,
  useSetGlobalFlagMutation,
  useSetOrgFlagOverrideMutation,
  useRemoveOrgFlagOverrideMutation,
  useGetFlagOrgsQuery,
} = featureFlagApi;
