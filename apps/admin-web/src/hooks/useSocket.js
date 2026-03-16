/**
 * @module useSocket
 * @description Socket.io hook for real-time attendance updates.
 */
import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

export const useSocket = (onCheckIn, onCheckOut) => {
  const socketRef = useRef(null);
  const handlersRef = useRef({ onCheckIn, onCheckOut });
  const { accessToken, orgInfo } = useSelector((state) => state.auth);

  // Update handlers reference without triggering re-connection
  useEffect(() => {
    handlersRef.current = { onCheckIn, onCheckOut };
  }, [onCheckIn, onCheckOut]);

  useEffect(() => {
    if (!accessToken || !orgInfo?.id) return;

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL, {
      auth: { token: accessToken },
    });

    socketRef.current.emit('join:org', { orgId: orgInfo.id });

    // Define listener wrappers that use the current handlers
    const handleCheckIn = (data) => {
      if (handlersRef.current?.onCheckIn) {
        handlersRef.current.onCheckIn(data);
      }
    };

    const handleCheckOut = (data) => {
      if (handlersRef.current?.onCheckOut) {
        handlersRef.current.onCheckOut(data);
      }
    };

    socketRef.current.on('attendance:checkin', handleCheckIn);
    socketRef.current.on('attendance:checkout', handleCheckOut);

    return () => {
      // Properly remove listeners before disconnecting
      if (socketRef.current) {
        socketRef.current.off('attendance:checkin', handleCheckIn);
        socketRef.current.off('attendance:checkout', handleCheckOut);
        socketRef.current.disconnect();
      }
    };
  }, [accessToken, orgInfo?.id]);

  return socketRef.current;
};
