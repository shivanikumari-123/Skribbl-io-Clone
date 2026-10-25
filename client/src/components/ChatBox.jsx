import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

export const ChatBox = ({ isDrawer }) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat_message', handleChatMessage);

    return () => {
      socket.off('chat_message', handleChatMessage);
    };
  }, [socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket || isDrawer) return;

    socket.emit('guess', { text: input.trim() });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
      <div className="p-3 bg-slate-900/60 border-b border-slate-700 font-bold text-slate-200">
        Chat & Guesses
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm">
        {messages.map((m) => {
          let badgeStyle = 'text-slate-300';
          if (m.type === 'correct') badgeStyle = 'text-green-400 font-bold bg-green-950/40 p-1.5 rounded border border-green-800/50';
          if (m.type === 'close') badgeStyle = 'text-amber-300 font-semibold bg-amber-950/40 p-1 rounded';

          return (
            <div key={m.id || Math.random()} className={`break-words ${badgeStyle}`}>
              {m.type === 'chat' ? (
                <>
                  <span className="font-bold text-slate-400">{m.playerName}: </span>
                  <span>{m.text}</span>
                </>
              ) : (
                <span>{m.text}</span>
              )}
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-2 bg-slate-900/80 border-t border-slate-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isDrawer}
          placeholder={isDrawer ? "You are drawing! Can't guess." : "Type your guess here..."}
          className="flex-1 bg-slate-800 text-slate-100 px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400 text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isDrawer || !input.trim()}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm"
        >
          Send
        </button>
      </form>
    </div>
  );
};