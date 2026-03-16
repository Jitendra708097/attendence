/**
 * @module usePagination
 * @description Pagination state helper hook.
 */
import { useState } from 'react';

export const usePagination = (initialPage = 1, pageSize = 20) => {
  const [page, setPage] = useState(initialPage);

  return {
    page,
    pageSize,
    setPage,
    pagination: {
      current: page,
      pageSize,
      onChange: setPage,
    },
  };
};
