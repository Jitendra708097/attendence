/**
 * @module useOrgTimezone
 * @description Hook for dayjs with org timezone.
 */
import { useMemo } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { useSelector } from 'react-redux';

dayjs.extend(utc);
dayjs.extend(timezone);

export const useOrgTimezone = () => {
  const orgInfo = useSelector((state) => state.auth.orgInfo);

  const tz = useMemo(() => {
    return orgInfo?.timezone || 'Asia/Kolkata';
  }, [orgInfo?.timezone]);

  return {
    timezone: tz,
    now: () => dayjs().tz(tz),
    format: (date, format) => dayjs(date).tz(tz).format(format),
    tz: (date) => dayjs(date).tz(tz),
  };
};
