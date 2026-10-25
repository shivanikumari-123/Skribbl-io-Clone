import { Player } from './Player.js';
import { Game } from './Game.js';

export class Room {
  constructor(id, settings, io) {
    this.id = id;
    this.settings = settings || {
      maxPlayers: 8,
      rounds: 3,
      drawTime: 80,
      wordCategory: 'general',
      hints: 2,
      isPublic: true,
    };
    this.io = io;
    this.players = new Map();

    this.game = new Game(
      this.settings,
      () => this.broadcastState(),
      (timeLeft) => this.broadcastTimer(timeLeft),
      () => this.handleRoundEnd(),
      (hintMask) => this.broadcastHint(hintMask)
    );
  }

  addPlayer(socketId, name, avatar, isHost = false) {
    if (this.players.size >= (this.settings.maxPlayers || 8)) {
      throw new Error('Room is full');
    }
    const player = new Player(socketId, name, avatar, isHost);
    this.players.set(socketId, player);
    return player;
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    this.players.delete(socketId);

    if (player && player.isHost && this.players.size > 0) {
      const nextPlayer = this.players.values().next().value;
      if (nextPlayer) nextPlayer.isHost = true;
    }

    return player;
  }

  handleGuess(socketId, text) {
    const player = this.players.get(socketId);
    if (!player) return;

    if (this.game.phase !== 'DRAWING') {
      this.broadcastChat(player.name, text, 'chat');
      return;
    }

    if (player.id === this.game.currentDrawerId) {
      return;
    }

    if (player.hasGuessed) {
      return;
    }

    const { isCorrect, isClose } = this.game.checkGuess(text);

    if (isCorrect) {
      player.hasGuessed = true;
      const points = this.game.calculatePoints();
      player.score += points;

      this.broadcastChat('SYSTEM', `${player.name} guessed the word! (+${points} pts)`, 'correct');

      const activeGuessers = Array.from(this.players.values()).filter(
        (p) => p.id !== this.game.currentDrawerId
      );
      const allGuessed = activeGuessers.every((p) => p.hasGuessed);

      if (allGuessed) {
        this.game.endRound();
      } else {
        this.broadcastState();
      }
    } else if (isClose) {
      this.broadcastChat('SYSTEM', `${player.name} is close!`, 'close');
      this.broadcastChat(player.name, text, 'chat');
    } else {
      this.broadcastChat(player.name, text, 'chat');
    }
  }

  handleRoundEnd() {
    if (this.game.phase === 'GAME_OVER') {
      this.broadcastState();
      return;
    }

    this.players.forEach((p) => {
      p.hasGuessed = false;
    });
    this.broadcastState();
  }

  broadcastState() {
    const playersArr = Array.from(this.players.values()).map((p) =>
      typeof p.toJSON === 'function' ? p.toJSON() : p
    );

    const state = {
      roomId: this.id,
      phase: this.game.phase,
      currentRound: this.game.currentRound,
      totalRounds: this.settings.rounds || 3,
      drawerId: this.game.currentDrawerId,
      word: this.game.phase === 'DRAWING' ? this.game.currentHintMask : this.game.currentWord,
      wordChoices: this.game.wordChoices,
      players: playersArr,
      settings: this.settings,
      canvasHistory: this.game.canvasHistory,
      timeLeft: this.game.timeLeft,
    };

    this.io.to(this.id).emit('game_state', state);
  }

  broadcastTimer(timeLeft) {
    this.io.to(this.id).emit('timer_tick', { timeLeft });
  }

  broadcastHint(mask) {
    this.io.to(this.id).emit('hint_update', { mask });
  }

  broadcastChat(playerName, text, type = 'chat') {
    this.io.to(this.id).emit('chat_message', {
      id: Date.now() + Math.random().toString(),
      playerName,
      text,
      type,
    });
  }
}

export class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(settings, io) {
    const roomId = this.generateRoomCode();
    const room = new Room(roomId, settings, io);
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    if (!roomId) return null;
    return this.rooms.get(roomId.toUpperCase()) || null;
  }

  deleteRoom(roomId) {
    if (roomId) {
      this.rooms.delete(roomId.toUpperCase());
    }
  }

getPublicRooms() {
    const publicRooms = [];
    for (const [id, room] of this.rooms.entries()) {
      // Check both room.settings.isPublic and root level room.isPublic
      const isPublic = room.settings?.isPublic ?? room.isPublic ?? true;
      
      // Treat null, undefined, or 'LOBBY' as waiting in lobby
      const isLobby = !room.game?.phase || room.game?.phase === 'LOBBY';

      if (isPublic && isLobby) {
        publicRooms.push({
          roomId: id,
          playerCount: room.players ? room.players.size : 1,
          maxPlayers: room.settings?.maxPlayers || 8,
          rounds: room.settings?.rounds || 3,
        });
      }
    }
    return publicRooms;
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }
}