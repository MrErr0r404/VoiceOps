import React, { useEffect, useRef } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { ConversationTurn } from './ConversationTurn';

export function ConversationTimeline() {
  const turns = useSessionStore(state => state.conversationTurns);
  const partial = useSessionStore(state => state.partialTranscript);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, partial]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {turns.length === 0 && !partial && (
        <div className="text-center text-gray-500 mt-10">Start speaking to begin...</div>
      )}
      {turns.map(t => <ConversationTurn key={t.id} turn={t} />)}
      {partial && (
        <div className="p-4 glass-card opacity-70 animate-pulse">
          <span className="text-xs font-bold text-voiceops-emerald block mb-1">USER (listening...)</span>
          <p className="text-sm italic">{partial}</p>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
