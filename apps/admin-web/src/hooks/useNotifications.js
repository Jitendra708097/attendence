/**
 * @module useNotifications
 * @description Hook for notification polling and bell state.
 */
import { useEffect, useState } from 'react';
import { useGetNotificationsQuery, useGetUnreadCountQuery } from '../store/api/notificationApi.js';

export const useNotifications = () => {
  const [bellOpen, setBellOpen] = useState(false);
  const [shouldPoll, setShouldPoll] = useState(true);

  // Query notifications with conditional polling
  const { data: notifications, isLoading: notificationsLoading } = useGetNotificationsQuery(
    { limit: 10 },
    { 
      pollingInterval: shouldPoll ? 30000 : 0, // Poll every 30 seconds only if shouldPoll is true
      skip: !shouldPoll,
    }
  );

  // Query unread count with conditional polling
  const { data: unreadCount, isLoading: unreadCountLoading } = useGetUnreadCountQuery(
    undefined,
    { 
      pollingInterval: shouldPoll ? 30000 : 0,
      skip: !shouldPoll,
    }
  );

  // Stop polling when component unmounts
  useEffect(() => {
    return () => {
      setShouldPoll(false);
    };
  }, []);

  return {
    notifications: notifications?.notifications || [],
    unreadCount: unreadCount?.count || 0,
    bellOpen,
    setBellOpen,
    isLoading: notificationsLoading || unreadCountLoading,
    startPolling: () => setShouldPoll(true),
    stopPolling: () => setShouldPoll(false),
  };
};
