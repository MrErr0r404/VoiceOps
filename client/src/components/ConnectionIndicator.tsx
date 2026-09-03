import React from 'react';
import { useSessionStore } from '../store/sessionStore';

export function ConnectionIndicator() {
  const isConnected = useSessionStore(state => state.isConnected);

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-voiceops-emerald animate-pulse' : 'bg-voiceops-red'}`}></span>
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
}
