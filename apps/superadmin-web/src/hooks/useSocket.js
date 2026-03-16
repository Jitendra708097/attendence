/**
 * @module useSocket
 * @description Platform-wide real-time events via Socket.io.
 *              Connects on mount, disconnects on unmount.
 *              Emits events to Redux store for live dashboard updates.
 */

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { getItem } from '@utils/storage.js';
import { STORAGE_KEYS } from '@utils/constants.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const useSocket = (eventHandlers = {}) => {
  const socketRef = useRef(null);
  const dispatch  = useDispatch();

  useEffect(() => {
    const token = getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth:            { token },
      transports:      ['websocket'],
      reconnection:    true,
      reconnectionDelay:     1000,
      reconnectionAttempts:  5,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.info('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.info('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // Attach consumer event handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, (data) => handler(data, dispatch));
    });

    return () => {
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return socketRef.current;
};
