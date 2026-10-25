import React from 'react';
import { useSocket } from '../context/SocketContext';

export const GameOverlay = ({ gameState, myId }) => {
  const { socket } = useSocket();
  const { phase, wordChoices, drawerId, word, players = [] } = gameState || {};

  const isDrawer = myId === drawerId;
  const isHost = players.find((p) => p.id === myId)?.isHost;

  const handleStartGame = () => {
    if (socket && isHost) {
      socket.emit('start_game');
    }
  };

  const handleSelectWord = (selectedWord) => {
    if (socket && isDrawer) {
      socket.emit('select_word', { word: selectedWord });
    }
  };

  if (phase === 'LOBBY') {
    return (
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-3xl font-extrabold text-amber-400 mb-2">Waiting for players...</h2>
        <p className="text-slate-400 text-sm mb-6">
          ({players.length} players connected — minimum 2 required)
        </p>

        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={players.length < 2}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-lg px-8 py-3 rounded-xl transition shadow-lg disabled:opacity-40"
          >
            Start Game
          </button>
        ) : (
          <p className="text-slate-400 animate-pulse text-sm">Waiting for host to start the game...</p>
        )}
      </div>
    );
  }

  if (phase === 'WORD_CHOICE') {
    return (
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center">
        {isDrawer ? (
          <div>
            <h2 className="text-2xl font-bold text-amber-400 mb-4">Choose a word to draw!</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {wordChoices?.map((w) => (
                <button
                  key={w}
                  onClick={() => handleSelectWord(w)}
                  className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-100 font-bold px-6 py-3 rounded-xl border border-slate-700 transition text-lg shadow-lg"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-slate-200 mb-2">Drawer is choosing a word...</h2>
            <p className="text-slate-400 text-sm animate-pulse">Get ready to guess!</p>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'ROUND_END') {
    return (
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl text-slate-400 mb-1">Round Ended!</h2>
        <p className="text-3xl font-extrabold text-amber-400 mb-6">
          The word was: <span className="underline decoration-amber-500">{word}</span>
        </p>
        <p className="text-slate-400 text-sm animate-pulse">Starting next round in a few seconds...</p>
      </div>
    );
  }

  if (phase === 'GAME_OVER') {
    const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
    const winner = sorted[0];

    return (
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-2">🎉</div>
        <h2 className="text-3xl font-black text-amber-400 mb-1">Game Over!</h2>
        {winner && (
          <p className="text-lg text-slate-200 mb-6">
            Winner: <span className="font-bold text-amber-300">{winner.name}</span> with {winner.score} pts!
          </p>
        )}

        {isHost && (
          <button
            onClick={handleStartGame}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition"
          >
            Play Again
          </button>
        )}
      </div>
    );
  }

  return null;
};