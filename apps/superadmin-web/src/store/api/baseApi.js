/**
 * @module baseApi
 * @description RTK Query base API with Axios adapter.
 *              All feature APIs inject endpoints into this base.
 *              Handles auth header injection via axiosInstance.
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import axiosInstance from '@api/axiosInstance.js';

const axiosBaseQuery =
  ({ baseUrl } = { baseUrl: '' }) =>
  async ({ url, method = 'GET', body, params, headers }) => {
    try {
      const result = await axiosInstance({
        url:    baseUrl + url,
        method,
        data:   body,
        params,
        headers,
      });
      return { data: result.data };
    } catch (axiosError) {
      return {
        error: {
          status: axiosError.response?.status,
          data:   axiosError.response?.data || axiosError.message,
        },
      };
    }
  };

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery:   axiosBaseQuery({ baseUrl: '' }),
  tagTypes: [
    'Orgs',
    'OrgDetail',
    'Health',
    'Analytics',
    'Audit',
    'Billing',
    'Impersonation',
    'FeatureFlags',
    'Dashboard',
  ],
  endpoints: () => ({}),
});
