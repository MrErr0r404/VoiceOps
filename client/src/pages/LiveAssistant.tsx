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
  const [activeTab, setActiveTab] = useState<'chat' | 'voice' | 'context'>('voice');

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendInstruction(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full pt-14 md:pt-0">
      {/* Mobile tab switcher */}
      <div className="flex md:hidden border-b border-white/5 bg-voiceops-card">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'chat' ? 'text-voiceops-emerald border-b-2 border-voiceops-emerald' : 'text-gray-500'}`}
        >
          Chat
        </button>
        <button 
          onClick={() => setActiveTab('voice')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'voice' ? 'text-voiceops-blue border-b-2 border-voiceops-blue' : 'text-gray-500'}`}
        >
          Voice
        </button>
        <button 
          onClick={() => setActiveTab('context')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'context' ? 'text-voiceops-amber border-b-2 border-voiceops-amber' : 'text-gray-500'}`}
        >
          Context
        </button>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-4 p-3 md:p-4 overflow-hidden">
        {/* LEFT: Conversation */}
        <div className={`w-full lg:w-1/3 flex flex-col glass-card ${activeTab === 'chat' ? 'flex' : 'hidden'} md:flex lg:h-full min-h-0`}>
          <div className="flex-1 overflow-y-auto">
            <ConversationTimeline />
          </div>
          
          {/* Quick Text Input */}
          <form onSubmit={handleSendText} className="p-2 px-3 md:px-4 border-t border-white/5 flex gap-2 shrink-0">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Speak or type command (e.g. Check Belt 4)..."
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-voiceops-blue"
            />
            <button 
              type="submit" 
              className="p-2 px-3 bg-voiceops-blue hover:bg-blue-600 rounded-lg text-sm font-bold text-white flex items-center gap-1 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="p-3 md:p-4 border-t border-white/5 shrink-0">
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
        <div className={`w-full lg:w-1/3 flex flex-col items-center justify-center p-4 md:p-8 relative ${activeTab === 'voice' ? 'flex' : 'hidden'} md:flex`}>
          <div className="mb-4 md:absolute md:top-8">
            <SessionStatus state={sessionState} />
          </div>
          
          <VoiceOrb state={sessionState} />
          
          <div className="w-full mt-6 md:mt-8">
            <AudioWaveform isActive={sessionState === 'SPEAKING'} />
          </div>
          
          <div className="mt-4 md:mt-8 text-center text-gray-400 text-sm h-12 flex flex-col items-center justify-center">
            {sessionState === 'LISTENING' && <span className="text-voiceops-emerald font-semibold animate-pulse">Listening for voice...</span>}
            {sessionState === 'PROCESSING' && <span className="text-voiceops-blue font-semibold">Reasoning operations...</span>}
            {sessionState === 'SPEAKING' && <span className="text-purple-400 font-semibold">Rime speaking output...</span>}
            {sessionState === 'TOOL_RUNNING' && <span className="text-voiceops-amber font-semibold animate-pulse">Running equipment tool (delayed)...</span>}
            {sessionState === 'INTERRUPTED' && <span className="text-voiceops-red font-bold animate-bounce">INTERRUPTED! Halting stale audio & tools</span>}
            {sessionState === 'IDLE' && <span className="text-gray-500">Ready. Toggle mic or use sample queries below.</span>}
          </div>

          {/* Quick scenario presets */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-sm">
            <button 
              onClick={() => sendInstruction("Find the maintenance procedure for Conveyor Belt 4 and guide me through the inspection.")}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-300 transition-colors"
            >
              "Guide inspection for Belt 4"
            </button>
            <button 
              onClick={() => sendInstruction("Stop. Actually check Conveyor Belt 7 instead and only give me the safety inspection.")}
              className="px-3 py-1.5 bg-voiceops-red/10 hover:bg-voiceops-red/20 border border-voiceops-red/30 rounded-full text-xs text-voiceops-red transition-colors"
            >
              "Stop, switch to Belt 7 safety"
            </button>
            <button 
              onClick={() => sendInstruction("Give me the inspection procedure for Cooling Pump 3.")}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-300 transition-colors"
            >
              "Cooling Pump 3 checklist"
            </button>
          </div>

          {/* Mobile-only mic + interrupt controls */}
          <div className="mt-6 md:hidden">
            <MicrophoneControls 
              isListening={isListening} 
              isSpeaking={sessionState === 'SPEAKING'}
              onToggleMic={isListening ? stopListening : startListening}
              onInterrupt={interrupt}
              onEndSession={endSession}
            />
          </div>
        </div>

        {/* RIGHT: Context & Metrics */}
        <div className={`w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto ${activeTab === 'context' ? 'flex' : 'hidden'} md:flex`}>
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
    </div>
  );
}
