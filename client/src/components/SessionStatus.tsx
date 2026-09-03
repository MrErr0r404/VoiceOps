import React from 'react';
import { SessionStateType } from '../types';

export function SessionStatus({ state }: { state: SessionStateType }) {
  const colors = {
    IDLE: 'text-gray-400 bg-gray-400/10',
    LISTENING: 'text-voiceops-emerald bg-voiceops-emerald/10',
    PROCESSING: 'text-voiceops-blue bg-voiceops-blue/10',
    TOOL_RUNNING: 'text-voiceops-amber bg-voiceops-amber/10',
    SPEAKING: 'text-voiceops-emerald bg-voiceops-emerald/10',
    INTERRUPTED: 'text-voiceops-red bg-voiceops-red/10',
    ERROR: 'text-voiceops-red bg-voiceops-red/10'
  };

  return (
    <div className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 w-max mx-auto ${colors[state]}`}>
      <span className={`w-2 h-2 rounded-full bg-current ${state !== 'IDLE' && state !== 'ERROR' ? 'animate-pulse' : ''}`} />
      {state}
    </div>
  );
}
