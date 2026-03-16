/**
 * @module server
 * @description Main server entry point with HTTP and Socket.io setup.
 */
const app = require('./src/app.js');
const { createServer } = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

const server = createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
});

server.listen(PORT, () => {
  console.log(`AttendEase backend running on port ${PORT}`);
});
