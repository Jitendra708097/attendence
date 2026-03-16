/**
 * @module baseApi
 * @description RTK Query base API configuration using Axios for HTTP requests.
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: async (args, api, extraOptions) => {
    const axiosInstance = (await import('../../api/axiosInstance.js')).default;
    try {
      const result = await axiosInstance({
        url: args.url,
        method: args.method || 'GET',
        data: args.body,
        params: args.params,
      });
      return { data: result.data.data };
    } catch (error) {
      return {
        error: {
          status: error.response?.status,
          data: error.response?.data,
        },
      };
    }
  },
  tagTypes: [
    'Org',
    'Branches',
    'Departments',
    'Shifts',
    'Employees',
    'Attendance',
    'Regularisations',
    'Leaves',
    'Holidays',
    'Notifications',
    'DeviceExceptions',
    'Billing',
    'Reports',
  ],
  endpoints: () => ({}),
});
