/**
 * @module attendanceSocket
 * @description Socket.io event handlers for real-time attendance updates.
 */
export const attachAttendanceListeners = (socket, onCheckIn, onCheckOut) => {
  if (!socket) return;

  socket.on('attendance:checkin', (data) => {
    if (onCheckIn) onCheckIn(data);
  });

  socket.on('attendance:checkout', (data) => {
    if (onCheckOut) onCheckOut(data);
  });

  socket.on('attendance:live-update', (data) => {
    if (onCheckIn) onCheckIn(data);
  });
};

export const detachAttendanceListeners = (socket) => {
  if (!socket) return;

  socket.off('attendance:checkin');
  socket.off('attendance:checkout');
  socket.off('attendance:live-update');
};
