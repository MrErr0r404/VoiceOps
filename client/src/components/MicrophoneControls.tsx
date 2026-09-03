import React from 'react';
import { Mic, MicOff, Headphones, VolumeX, Square, PhoneOff } from 'lucide-react';

interface Props {
  isListening: boolean;
  isSpeaking: boolean;
  onToggleMic: () => void;
  onInterrupt: () => void;
  onEndSession: () => void;
}

export function MicrophoneControls({ isListening, isSpeaking, onToggleMic, onInterrupt, onEndSession }: Props) {
  return (
    <div className="flex items-center justify-center gap-3 p-4 glass-card mt-4">
      {/* Mic toggle */}
      <button 
        onClick={onToggleMic}
        className={`p-4 rounded-full transition-all flex items-center justify-center ${
          isListening 
            ? 'bg-voiceops-emerald text-black shadow-lg shadow-voiceops-emerald/50 scale-105 ring-2 ring-voiceops-emerald/80' 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
        title={isListening ? 'Mute Microphone' : 'Unmute Microphone (Hands-free Voice)'}
        aria-label={isListening ? 'Mute Microphone' : 'Unmute Microphone'}
      >
        {isListening ? <Mic size={24} className="animate-pulse" /> : <MicOff size={24} />}
      </button>

      {/* Immediate Hardware Interruption Button - Always accessible, prominent during speech */}
      <button 
        onClick={onInterrupt}
        className={`px-4 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg ${
          isSpeaking 
            ? 'bg-voiceops-red text-white hover:bg-red-600 animate-pulse ring-2 ring-voiceops-red shadow-voiceops-red/50 scale-105' 
            : 'bg-red-950/40 text-red-400/60 hover:bg-voiceops-red hover:text-white border border-red-900/50'
        }`}
        title="Emergency Barge-In / Interrupt"
        aria-label="Interrupt AI"
      >
        <Square size={16} className="fill-current" />
        <span className="text-xs uppercase tracking-wider font-mono">
          {isSpeaking ? 'BARGE-IN / STOP' : 'INTERRUPT'}
        </span>
      </button>

      <button className="p-3 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700" title="Hands-free Mode Active">
        <Headphones size={20} className={isListening ? 'text-voiceops-emerald' : ''} />
      </button>

      <button 
        onClick={onEndSession}
        className="p-3 rounded-full bg-gray-800 text-gray-400 hover:bg-voiceops-red hover:text-white transition-colors border border-white/5"
        title="End Session"
      >
        <PhoneOff size={20} />
      </button>
    </div>
  );
}
