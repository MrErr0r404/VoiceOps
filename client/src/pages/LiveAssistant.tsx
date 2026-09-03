import React, { useState } from 'react';
import { useVoiceSession } from '../hooks/useVoiceSession';
import { ConversationTimeline } from '../components/ConversationTimeline';
import { MicrophoneControls } from '../components/MicrophoneControls';
import { SessionStatus } from '../components/SessionStatus';
import { VoiceOrb } from '../components/VoiceOrb';
import { AudioWaveform } from '../components/AudioWaveform';
import { OperationalContext } from '../components/OperationalContext';
import { MetricsPanel } from '../components/MetricsPanel';
import { EventTimeline } from '../components/EventTimeline';
import { useSettingsStore } from '../store/settingsStore';
import { Send } from 'lucide-react';

export function LiveAssistant() {
  const { endSession, startListening, stopListening, interrupt, isListening, sessionState, sendInstruction } = useVoiceSession();
  const { showEventTimeline, showMetrics } = useSettingsStore();
  const [inputText, setInputText] = useState('');

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendInstruction(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 p-4 overflow-hidden">
      {/* LEFT: Conversation */}
      <div className="w-full lg:w-1/3 flex flex-col glass-card h-full">
        <ConversationTimeline />
        
        {/* Quick Text Input for manual commands / demo fallback */}
        <form onSubmit={handleSendText} className="p-2 px-4 border-t border-white/5 flex gap-2">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Speak or type command (e.g. Check Belt 4)..."
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-voiceops-blue"
          />
          <button 
            type="submit" 
            className="p-1.5 px-3 bg-voiceops-blue hover:bg-blue-600 rounded-lg text-xs font-bold text-white flex items-center gap-1 transition-colors"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>

        <div className="p-4 border-t border-white/5">
          <MicrophoneControls 
            isListening={isListening} 
            isSpeaking={sessionState === 'SPEAKING'}
            onToggleMic={isListening ? stopListening : startListening}
            onInterrupt={interrupt}
            onEndSession={endSession}
          />
        </div>
      </div>

      {/* CENTER: Voice UI */}
      <div className="w-full lg:w-1/3 flex flex-col items-center justify-center p-8 relative">
        <div className="absolute top-8">
          <SessionStatus state={sessionState} />
        </div>
        
        <VoiceOrb state={sessionState} />
        
        <div className="w-full mt-8">
          <AudioWaveform isActive={sessionState === 'SPEAKING'} />
        </div>
        
        <div className="mt-8 text-center text-gray-400 text-sm h-12 flex flex-col items-center justify-center">
          {sessionState === 'LISTENING' && <span className="text-voiceops-emerald font-semibold animate-pulse">Listening for voice...</span>}
          {sessionState === 'PROCESSING' && <span className="text-voiceops-blue font-semibold">Reasoning operations...</span>}
          {sessionState === 'SPEAKING' && <span className="text-purple-400 font-semibold">Rime speaking output...</span>}
          {sessionState === 'TOOL_RUNNING' && <span className="text-voiceops-amber font-semibold animate-pulse">Running equipment tool (delayed)...</span>}
          {sessionState === 'INTERRUPTED' && <span className="text-voiceops-red font-bold animate-bounce">INTERRUPTED! Halting stale audio & tools</span>}
          {sessionState === 'IDLE' && <span className="text-gray-500">Ready. Toggle mic or use sample queries below.</span>}
        </div>

        {/* Quick scenario preset shortcuts */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-sm">
          <button 
            onClick={() => sendInstruction("Find the maintenance procedure for Conveyor Belt 4 and guide me through the inspection.")}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[11px] text-gray-300 transition-colors"
          >
            "Guide inspection for Belt 4"
          </button>
          <button 
            onClick={() => sendInstruction("Stop. Actually check Conveyor Belt 7 instead and only give me the safety inspection.")}
            className="px-2.5 py-1 bg-voiceops-red/10 hover:bg-voiceops-red/20 border border-voiceops-red/30 rounded-full text-[11px] text-voiceops-red transition-colors"
          >
            "Stop, switch to Belt 7 safety"
          </button>
          <button 
            onClick={() => sendInstruction("Give me the inspection procedure for Cooling Pump 3.")}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[11px] text-gray-300 transition-colors"
          >
            "Cooling Pump 3 checklist"
          </button>
        </div>
      </div>

      {/* RIGHT: Context & Metrics */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
        <OperationalContext />
        {showMetrics && <MetricsPanel />}
        {showEventTimeline && (
          <div className="mt-auto">
            <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">Event Timeline</h3>
            <EventTimeline />
          </div>
        )}
      </div>
    </div>
  );
}
