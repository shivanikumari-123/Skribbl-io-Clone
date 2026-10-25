import React from 'react';

const AVATARS = ['😎', '🤠', '🤖', '👾', '🦊', '🐱', '🐶', '🦁', '🦄', '🐼'];

export const AvatarPicker = ({ selectedAvatar, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center my-3">
      {AVATARS.map((avatar) => (
        <button
          key={avatar}
          type="button"
          onClick={() => onSelect(avatar)}
          className={`text-2xl p-2 rounded-full border-2 transition-all hover:scale-110 ${
            selectedAvatar === avatar
              ? 'border-amber-400 bg-amber-400/20 scale-110'
              : 'border-slate-700 bg-slate-800 hover:border-slate-500'
          }`}
        >
          {avatar}
        </button>
      ))}
    </div>
  );
};