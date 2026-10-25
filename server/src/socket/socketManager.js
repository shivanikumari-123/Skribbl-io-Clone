import { registerSocketHandlers } from './eventHandlers.js';

export function initializeSocketManager(io, roomManager) {
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    registerSocketHandlers(io, socket, roomManager);
  });
}