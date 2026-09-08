import React from 'react';
import { SessionStateType } from '../types';

export function SessionStatus({ state }: { state: SessionStateType }) {
  const colors = {
    IDLE: 'text-gray-400 bg-gray-400/10',
    LISTENING: 'text-voiceops-emerald bg-voiceops-emerald/10 border border-voiceops-emerald/20',
    PROCESSING: 'text-voiceops-blue bg-voiceops-blue/10 border border-voiceops-blue/20',
    TOOL_RUNNING: 'text-voiceops-amber bg-voiceops-amber/10 border border-voiceops-amber/20',
    SPEAKING: 'text-voiceops-emerald bg-voiceops-emerald/10 border border-voiceops-emerald/20',
    INTERRUPTED: 'text-voiceops-red bg-voiceops-red/10 border border-voiceops-red/20',
    ERROR: 'text-gray-400 bg-gray-500/10 border border-gray-500/20'
  };

  const displayText = state === 'ERROR' ? 'READY' : state;

  return (
    <div className={`px-4 py-1.5 rounded-full font-semibold text-xs tracking-wider uppercase flex items-center gap-2 w-max mx-auto shadow-sm ${colors[state]}`}>
      <span className={`w-2 h-2 rounded-full bg-current ${state !== 'IDLE' && state !== 'ERROR' ? 'animate-pulse' : ''}`} />
      {displayText}
    </div>
  );
}
