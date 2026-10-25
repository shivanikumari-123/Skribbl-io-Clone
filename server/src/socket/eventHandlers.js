export function registerSocketHandlers(io, socket, roomManager) {
  socket.on('get_public_rooms', (callback) => {
    const rooms = roomManager.getPublicRooms();
    if (typeof callback === 'function') {
      callback(rooms);
    }
  });

  socket.on('create_room', ({ name, avatar, settings }, callback) => {
    try {
      const room = roomManager.createRoom(settings, io);
      socket.join(room.id);
      socket.roomId = room.id;

      const player = room.addPlayer(socket.id, name, avatar, true);
      socket.playerId = player.id;

      room.broadcastState();

      if (typeof callback === 'function') {
        callback({ success: true, roomId: room.id, playerId: player.id, isHost: true });
      }
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  socket.on('join_room', ({ roomId, name, avatar }, callback) => {
    try {
      const room = roomManager.getRoom(roomId);
      if (!room) {
        if (typeof callback === 'function') callback({ success: false, error: 'Room not found' });
        return;
      }

      if (room.players.size >= (room.settings.maxPlayers || 8)) {
        if (typeof callback === 'function') callback({ success: false, error: 'Room is full' });
        return;
      }

      socket.join(room.id);
      socket.roomId = room.id;

      const player = room.addPlayer(socket.id, name, avatar, false);
      socket.playerId = player.id;

      room.broadcastState();

      if (typeof callback === 'function') {
        callback({ success: true, roomId: room.id, playerId: player.id, isHost: false });
      }
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  socket.on('start_game', () => {
    const room = roomManager.getRoom(socket.roomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player || !player.isHost) return;

    const playerList = Array.from(room.players.values());
    const started = room.game.start(playerList);
    if (started) {
      room.broadcastState();
    }
  });

  socket.on('select_word', (data) => {
    const room = roomManager.getRoom(socket.roomId);
    if (!room) return;

    const chosenWord = typeof data === 'string' ? data : (data?.word || data?.text || '');
    room.game.selectWord(chosenWord);
  });

  socket.on('guess', (data) => {
    const room = roomManager.getRoom(socket.roomId);
    if (!room) return;

    const text = typeof data === 'string' ? data : (data?.text || '');
    room.handleGuess(socket.id, text);
  });

  socket.on('draw_line', (lineData) => {
    const room = roomManager.getRoom(socket.roomId);
    if (!room) return;

    room.game.canvasHistory.push(lineData);
    socket.to(room.id).emit('draw_line', lineData);
  });

  socket.on('clear_canvas', () => {
    const room = roomManager.getRoom(socket.roomId);
    if (!room) return;

    room.game.canvasHistory = [];
    io.to(room.id).emit('clear_canvas');
  });

  socket.on('disconnect', () => {
    if (!socket.roomId) return;
    const room = roomManager.getRoom(socket.roomId);
    if (!room) return;

    room.removePlayer(socket.id);

    if (room.players.size === 0) {
      roomManager.deleteRoom(socket.roomId);
    } else {
      room.broadcastState();
    }
  });
}