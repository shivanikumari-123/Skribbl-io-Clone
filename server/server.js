import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './src/models/Room.js';
import { initializeSocketManager } from './src/socket/socketManager.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();

initializeSocketManager(io, roomManager);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Skribbl Clone Server running on port ${PORT}`);
});