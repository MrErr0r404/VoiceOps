import React, { useEffect, useRef } from 'react';
import { useSessionStore } from '../store/sessionStore';

export function EventTimeline() {
  const events = useSessionStore(state => state.events);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView();
  }, [events]);

  const catColors = {
    user: 'text-voiceops-emerald',
    generation: 'text-voiceops-blue',
    tool: 'text-voiceops-amber',
    rime: 'text-purple-400',
    error: 'text-voiceops-red',
    system: 'text-gray-400'
  };

  return (
    <div className="h-64 overflow-y-auto bg-black/50 p-2 rounded border border-white/10 font-mono text-xs">
      {events.map(e => (
        <div key={e.id} className="py-1 border-b border-white/5 flex gap-2 hover:bg-white/5">
          <span className="text-gray-500 whitespace-nowrap">
            {new Date(e.timestamp).toISOString().split('T')[1].replace('Z', '')}
          </span>
          <span className={`${catColors[e.category]} font-bold whitespace-nowrap`}>
            [{e.type}]
          </span>
          {e.generationId !== undefined && (
            <span className="text-gray-400">g:{e.generationId}</span>
          )}
          <span className="text-gray-300 truncate" title={JSON.stringify(e.metadata)}>
            {e.metadata ? JSON.stringify(e.metadata) : ''}
          </span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
