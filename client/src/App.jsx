import React, { useState, useEffect } from 'react';
import { useSocket } from './context/SocketContext';
import { Lobby } from './components/Lobby';
import { Canvas } from './components/Canvas';
import { ChatBox } from './components/ChatBox';
import { Leaderboard } from './components/Leaderboard';
import { GameOverlay } from './components/GameOverlay';

export function App() {
  const { socket } = useSocket();
  const [session, setSession] = useState(null); // { roomId, playerId, isHost }
  const [gameState, setGameState] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!socket) return;

    const handleGameState = (state) => {
      setGameState(state);
      if (state.timeLeft !== undefined) {
        setTimeLeft(state.timeLeft);
      }
    };

    const handleTimerTick = ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    };

    const handleHintUpdate = ({ mask }) => {
      setGameState((prev) => (prev ? { ...prev, word: mask } : prev));
    };

    socket.on('game_state', handleGameState);
    socket.on('timer_tick', handleTimerTick);
    socket.on('hint_update', handleHintUpdate);

    return () => {
      socket.off('game_state', handleGameState);
      socket.off('timer_tick', handleTimerTick);
      socket.off('hint_update', handleHintUpdate);
    };
  }, [socket]);

  const handleLeave = () => {
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
    setSession(null);
    setGameState(null);
  };

  if (!session) {
    return <Lobby onJoined={setSession} />;
  }

  const isDrawer = gameState?.drawerId === session.playerId;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-extrabold text-amber-400 text-lg">
            Round {gameState?.currentRound || 1} / {gameState?.totalRounds || 3}
          </span>
          <div className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg text-xs font-mono">
            ROOM: <span className="text-amber-400 font-bold">{session.roomId}</span>
          </div>
        </div>

        {/* Word Display / Mask */}
        <div className="text-xl font-mono tracking-[0.2em] font-bold text-amber-300 bg-slate-950 px-6 py-1.5 rounded-lg border border-slate-800">
          {gameState?.word || ' waiting... '}
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg text-sm font-bold text-amber-400">
            ⏳ {timeLeft}s
          </div>
          <button
            onClick={handleLeave}
            className="bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
          >
            Leave Game
          </button>
        </div>
      </header>

      {/* Main Game Interface */}
      <main className="flex-1 relative p-4 grid grid-cols-1 md:grid-cols-12 gap-4 max-w-7xl w-full mx-auto overflow-hidden">
        <GameOverlay gameState={gameState} myId={session.playerId} />

        {/* Left Column - Leaderboard */}
        <div className="md:col-span-3 h-full overflow-hidden">
          <Leaderboard players={gameState?.players || []} drawerId={gameState?.drawerId} />
        </div>

        {/* Middle Column - Canvas */}
        <div className="md:col-span-6 flex flex-col h-full overflow-hidden">
          <Canvas isDrawer={isDrawer} canvasHistory={gameState?.canvasHistory || []} />
        </div>

        {/* Right Column - Chat */}
        <div className="md:col-span-3 h-full overflow-hidden">
          <ChatBox isDrawer={isDrawer} />
        </div>
      </main>
    </div>
  );
}