import React from 'react';
import { ConversationTurnData } from '../types';

export function ConversationTurn({ turn }: { turn: ConversationTurnData }) {
  const isInterrupted = turn.status === 'INTERRUPTED' || turn.status === 'SUPERSEDED';
  
  return (
    <div className={`p-4 glass-card my-2 flex flex-col gap-2 ${isInterrupted ? 'opacity-50 border-l-4 border-l-voiceops-red' : ''}`}>
      <div className="flex justify-between text-xs">
        <span className={`font-bold ${turn.role === 'USER' ? 'text-voiceops-emerald' : 'text-voiceops-blue'}`}>
          {turn.role}
        </span>
        <span className="text-gray-500">Gen {turn.generationId} | {new Date(turn.timestamp).toLocaleTimeString()}</span>
      </div>
      <p className={`text-sm text-gray-200 ${isInterrupted ? 'line-through' : ''}`}>
        {turn.text}
      </p>
      {isInterrupted && (
        <span className="text-xs font-bold text-voiceops-red bg-voiceops-red/10 px-2 py-1 rounded w-max">
          {turn.status}
        </span>
      )}
    </div>
  );
}
