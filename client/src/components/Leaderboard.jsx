import React from 'react';

export const Leaderboard = ({ players = [], drawerId }) => {
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="bg-slate-800/90 rounded-xl border border-slate-700 p-3 shadow-lg flex flex-col h-full">
      <h3 className="text-amber-400 font-bold text-sm mb-3 flex items-center gap-2">
        🏆 Players ({players.length})
      </h3>
      <div className="space-y-2 overflow-y-auto flex-1">
        {sortedPlayers.map((player, idx) => {
          const isDrawer = player.id === drawerId;
          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2 rounded-lg border transition ${
                player.hasGuessed
                  ? 'bg-green-950/40 border-green-700/50 text-green-300'
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-slate-500 w-4">#{idx + 1}</span>
                <span className="text-xl">{player.avatar || '😎'}</span>
                <div className="truncate">
                  <div className="text-xs font-semibold truncate flex items-center gap-1">
                    {player.name}
                    {player.isHost && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1 rounded">Host</span>}
                  </div>
                  {isDrawer && <div className="text-[10px] text-amber-400 font-medium">Drawing...</div>}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-100">{player.score || 0}</span>
                <span className="text-[10px] block text-slate-500">pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};