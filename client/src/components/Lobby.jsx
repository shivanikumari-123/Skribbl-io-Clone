import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { AvatarPicker } from './AvatarPicker';

export const Lobby = ({ onJoined }) => {
  const { socket, connected } = useSocket();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('😎');
  const [roomCode, setRoomCode] = useState('');
  const [publicRooms, setPublicRooms] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(80);
  const [wordCategory, setWordCategory] = useState('general');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!socket || !connected) return;

    socket.emit('get_public_rooms', (rooms) => {
      if (Array.isArray(rooms)) setPublicRooms(rooms);
    });
  }, [socket, connected]);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!name.trim() || !socket) return;

    socket.emit(
      'create_room',
      {
        name: name.trim(),
        avatar,
        settings: {
          isPublic: Boolean(isPublic),
          rounds: Number(rounds),
          drawTime: Number(drawTime),
          wordCategory,
          maxPlayers: 8,
        },
      },
      (res) => {
        if (res?.success) {
          onJoined({ roomId: res.roomId, playerId: res.playerId, isHost: true });
        } else {
          setError(res?.error || 'Failed to create room');
        }
      }
    );
  };

  const handleJoinRoom = (codeToJoin) => {
    const targetRoom = codeToJoin || roomCode;
    if (!name.trim() || !targetRoom.trim() || !socket) return;

    socket.emit(
      'join_room',
      {
        roomId: targetRoom.trim().toUpperCase(),
        name: name.trim(),
        avatar,
      },
      (res) => {
        if (res?.success) {
          onJoined({ roomId: res.roomId, playerId: res.playerId, isHost: false });
        } else {
          setError(res?.error || 'Failed to join room');
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl">
        
        {/* Profile & Settings */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-black text-amber-400 tracking-tight">SKRIBBL CLONE</h1>
          {error && <div className="p-2 bg-red-950/60 border border-red-800 text-red-300 rounded text-xs">{error}</div>}

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter nickname"
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Choose Avatar</label>
            <AvatarPicker selectedAvatar={avatar} onSelect={setAvatar} />
          </div>

          <form onSubmit={handleCreateRoom} className="space-y-3 border-t border-slate-800 pt-3">
            <h3 className="text-sm font-bold text-slate-300">Room Settings</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Rounds</label>
                <select
                  value={rounds}
                  onChange={(e) => setRounds(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                >
                  <option value={3}>3 Rounds</option>
                  <option value={5}>5 Rounds</option>
                  <option value={8}>8 Rounds</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Draw Time</label>
                <select
                  value={drawTime}
                  onChange={(e) => setDrawTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                >
                  <option value={60}>60s</option>
                  <option value={80}>80s</option>
                  <option value={100}>100s</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Word Category</label>
              <select
                value={wordCategory}
                onChange={(e) => setWordCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
              >
                <option value="general">General</option>
                <option value="animals">Animals</option>
                <option value="objects">Objects</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="accent-amber-500 rounded"
              />
              Public Room (Visible in lobby)
            </label>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg transition disabled:opacity-50"
            >
              Create Room
            </button>
          </form>
        </div>

        {/* Join Private & Public Rooms */}
        <div className="flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-2">Join Private Room</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 uppercase focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={() => handleJoinRoom()}
                disabled={!name.trim() || !roomCode.trim()}
                className="bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold px-4 rounded-lg transition disabled:opacity-50"
              >
                Join
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[200px]">
            <h3 className="text-sm font-bold text-slate-300 mb-2">Public Rooms</h3>
            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-800 rounded-lg p-2 bg-slate-950/50">
              {publicRooms.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-6">No public rooms available.</div>
              ) : (
                publicRooms.map((r) => (
                  <div
                    key={r.roomId}
                    className="flex items-center justify-between p-2 bg-slate-800/60 rounded border border-slate-700/60 text-xs"
                  >
                    <div>
                      <span className="font-bold text-amber-400">{r.roomId}</span>
                      <span className="text-slate-400 ml-2">
                        ({r.playerCount}/{r.maxPlayers} players)
                      </span>
                    </div>
                    <button
                      onClick={() => handleJoinRoom(r.roomId)}
                      disabled={!name.trim()}
                      className="bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-slate-950 px-3 py-1 rounded font-bold transition disabled:opacity-50"
                    >
                      Join
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};