import React from 'react';
import { SessionStateType } from '../types';

interface Props {
  state: SessionStateType;
}

export function VoiceOrb({ state }: Props) {
  const stateStyles = {
    IDLE: 'bg-gray-600 shadow-none',
    LISTENING: 'bg-voiceops-emerald shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-pulse',
    PROCESSING: 'bg-voiceops-blue shadow-[0_0_30px_rgba(59,130,246,0.5)] animate-spin',
    TOOL_RUNNING: 'bg-voiceops-amber shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-bounce',
    SPEAKING: 'bg-voiceops-emerald shadow-[0_0_50px_rgba(16,185,129,0.8)] scale-110 transition-transform duration-200',
    INTERRUPTED: 'bg-voiceops-red shadow-[0_0_30px_rgba(239,68,68,0.5)]',
    ERROR: 'bg-voiceops-red shadow-[0_0_30px_rgba(239,68,68,0.8)]'
  };

  return (
    <div className="flex justify-center items-center h-48 w-48 mx-auto my-8">
      <div
        aria-label={`Voice status: ${state}`}
        className={`w-32 h-32 rounded-full transition-all duration-500 ease-in-out ${stateStyles[state]}`}
      ></div>
    </div>
  );
}
